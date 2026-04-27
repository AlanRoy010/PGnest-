"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  formatCurrency,
  formatRelative,
  depositPercentage,
  DEDUCTION_STATUS_CONFIG,
} from "@/lib/utils";
import {
  Shield,
  Plus,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Deposit, DepositDeduction } from "@/types";

interface DepositWithBooking extends Deposit {
  booking: {
    id: string;
    tenant: { full_name: string; phone: string };
    listing: { title: string; area: string };
  };
  deductions: DepositDeduction[];
}

export default function OwnerDepositPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useUser();

  const [deposits, setDeposits] = useState<DepositWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deductForm, setDeductForm] = useState<{
    depositId: string;
    bookingId: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDeposits = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("deposits")
        .select(
          `
          *,
          booking:bookings!inner(
            id,
            tenant:profiles!bookings_tenant_id_fkey(full_name, phone),
            listing:listings(title, area)
          ),
          deductions:deposit_deductions(*)
        `
        )
        .eq("booking.owner_id", profile!.id)
        .order("created_at", { ascending: false });

      setDeposits((data as DepositWithBooking[]) || []);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile]);

  useEffect(() => {
    if (profile) fetchDeposits();
  }, [profile, fetchDeposits]);

  const raiseDeduction = async () => {
    if (!deductForm) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!reason.trim()) { toast.error("Enter a reason for the deduction"); return; }

    const deposit = deposits.find((d) => d.id === deductForm.depositId);
    if (deposit && amt > deposit.current_balance) {
      toast.error(
        `Amount cannot exceed current balance of ${formatCurrency(deposit.current_balance)}`
      );
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("deposit_deductions").insert({
      deposit_id: deductForm.depositId,
      booking_id: deductForm.bookingId,
      raised_by_owner_id: profile!.id,
      amount: amt,
      reason: reason.trim(),
    });
    setSaving(false);

    if (error) { toast.error("Failed to raise deduction"); return; }

    toast.success("Deduction raised — tenant has been notified");
    setDeductForm(null);
    setAmount("");
    setReason("");
    fetchDeposits();
  };

  const cancelDeduction = async (deductionId: string) => {
    const { error } = await supabase
      .from("deposit_deductions")
      .update({ status: "rejected" })
      .eq("id", deductionId);

    if (error) { toast.error("Failed to cancel deduction"); return; }
    toast.success("Deduction cancelled");
    fetchDeposits();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">
          Deposit Tracker
        </h1>
        <p className="text-sm text-[#78716c] mt-0.5">
          Manage security deposits for all your active tenants
        </p>
      </div>

      {deposits.length === 0 && (
        <div className="text-center py-20 bg-white border border-[#e7e5e4] rounded-2xl">
          <Shield className="w-10 h-10 text-[#d6d3d1] mx-auto mb-4" />
          <h3 className="font-display font-semibold text-[#1c1917] mb-1">
            No active deposits
          </h3>
          <p className="text-sm text-[#78716c]">
            Deposits will appear here once tenants confirm their bookings
          </p>
        </div>
      )}

      <div className="space-y-4">
        {deposits.map((deposit) => {
          const pct = depositPercentage(
            deposit.current_balance,
            deposit.original_amount
          );
          const deducted = deposit.original_amount - deposit.current_balance;
          const isExpanded = expandedId === deposit.id;
          const pendingDeductions =
            deposit.deductions?.filter((d) => d.status === "pending") || [];
          const booking = deposit.booking;

          return (
            <div
              key={deposit.id}
              className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-[#1c1917]">
                        {booking?.tenant?.full_name}
                      </h3>
                      <span className="text-xs text-[#a8a29e]">
                        {booking?.tenant?.phone}
                      </span>
                      {pendingDeductions.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {pendingDeductions.length} pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#a8a29e]">
                      {booking?.listing?.title} · {booking?.listing?.area}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-semibold text-[#1c1917]">
                      {formatCurrency(deposit.current_balance)}
                    </div>
                    <div className="text-xs text-[#a8a29e]">
                      of {formatCurrency(deposit.original_amount)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-[#f5f5f4] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 75
                          ? "bg-green-500"
                          : pct > 40
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-[#a8a29e]">
                      {pct}% remaining
                    </span>
                    {deducted > 0 && (
                      <span className="text-xs text-red-500">
                        −{formatCurrency(deducted)} deducted
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  {deposit.status === "active" && (
                    <button
                      onClick={() =>
                        setDeductForm({
                          depositId: deposit.id,
                          bookingId: deposit.booking_id,
                        })
                      }
                      className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Raise deduction
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : deposit.id)
                    }
                    className="flex items-center gap-1.5 text-xs font-medium text-[#57534e] px-3 py-1.5 rounded-lg hover:bg-[#f5f5f4] transition-colors ml-auto"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {deposit.deductions?.length || 0} deductions
                  </button>
                </div>
              </div>

              {/* Expanded deductions */}
              {isExpanded && (
                <div className="border-t border-[#f5f5f4] bg-[#fafaf9]">
                  {!deposit.deductions || deposit.deductions.length === 0 ? (
                    <p className="text-sm text-[#a8a29e] text-center py-6">
                      No deductions raised yet
                    </p>
                  ) : (
                    <div className="divide-y divide-[#f5f5f4]">
                      {deposit.deductions.map((d) => {
                        const statusCfg = DEDUCTION_STATUS_CONFIG[d.status];
                        return (
                          <div
                            key={d.id}
                            className="px-5 py-4 flex items-start justify-between gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}
                                >
                                  {statusCfg.label}
                                </span>
                                <span className="text-xs text-[#a8a29e]">
                                  {formatRelative(d.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-[#1c1917]">
                                {d.reason}
                              </p>
                              {d.tenant_response && (
                                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                  <p className="text-xs font-medium text-red-600 mb-0.5">
                                    Tenant disputed:
                                  </p>
                                  <p className="text-xs text-red-700">
                                    {d.tenant_response}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="font-semibold text-[#1c1917]">
                                −{formatCurrency(d.amount)}
                              </div>
                              {d.status === "pending" && (
                                <button
                                  onClick={() => cancelDeduction(d.id)}
                                  className="text-xs text-[#a8a29e] hover:text-red-500 mt-1 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Raise Deduction Modal */}
      {deductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e5e4]">
              <h2 className="font-display text-lg font-semibold text-[#1c1917]">
                Raise Deduction
              </h2>
              <button
                onClick={() => setDeductForm(null)}
                className="p-1.5 text-[#a8a29e] hover:text-[#1c1917] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  The tenant will be notified and can approve or dispute this
                  deduction. The deposit balance will only update after tenant
                  approval.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Deduction amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the damage or reason for deduction clearly..."
                  className="w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-[#e7e5e4]">
              <button
                onClick={() => setDeductForm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#57534e] hover:text-[#1c1917] border border-[#e7e5e4] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={raiseDeduction}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Raise deduction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}