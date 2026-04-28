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
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DepositDeduction } from "@/types";

type RaisedBy = { full_name: string } | null;
type DeductionWithOwner = DepositDeduction & { raised_by: RaisedBy };

interface TenantDeposit {
  id: string;
  original_amount: number;
  current_balance: number;
  status: string;
  created_at: string;
  updated_at: string;
  booking: {
    id: string;
    monthly_rent: number;
    move_in_date: string;
    status: string;
    listing: { title: string; area: string; address: string };
    owner: { full_name: string; phone: string };
  };
  deductions: DeductionWithOwner[];
}

export default function TenantDepositPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: userLoading } = useUser();

  const [deposit, setDeposit] = useState<TenantDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeForm, setDisputeForm] = useState<DepositDeduction | null>(null);
  const [disputeText, setDisputeText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDeposit = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("deposits")
        .select(
          `
          *,
          booking:bookings!inner(
            *,
            listing:listings(title, area, address),
            owner:profiles!bookings_owner_id_fkey(full_name, phone)
          ),
          deductions:deposit_deductions(
            *,
            raised_by:profiles!deposit_deductions_raised_by_owner_id_fkey(full_name)
          )
        `
        )
        .eq("booking.tenant_id", profile!.id)
        .eq("booking.status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setDeposit(data as TenantDeposit | null);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile]);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) { setLoading(false); return; }
    fetchDeposit();

    const channel = supabase
      .channel("deposit-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposit_deductions" },
        () => fetchDeposit()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userLoading, profile, fetchDeposit, supabase]);

  const approveDeduction = async (deduction: DepositDeduction) => {
    setSaving(true);
    const { error } = await supabase
      .from("deposit_deductions")
      .update({ status: "approved" })
      .eq("id", deduction.id);
    setSaving(false);

    if (error) { toast.error("Failed to approve deduction"); return; }
    toast.success("Deduction approved — your deposit balance has been updated");
    fetchDeposit();
  };

  const submitDispute = async () => {
    if (!disputeForm) return;
    if (!disputeText.trim()) {
      toast.error("Explain why you're disputing this deduction");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("deposit_deductions")
      .update({ status: "disputed", tenant_response: disputeText.trim() })
      .eq("id", disputeForm.id);
    setSaving(false);

    if (error) { toast.error("Failed to submit dispute"); return; }
    toast.success("Dispute submitted — the owner will review your response");
    setDisputeForm(null);
    setDisputeText("");
    fetchDeposit();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
      </div>
    );

  if (!deposit)
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white border border-[#e7e5e4] rounded-2xl">
          <Shield className="w-10 h-10 text-[#d6d3d1] mx-auto mb-4" />
          <h3 className="font-display font-semibold text-[#1c1917] mb-1">
            No active deposit
          </h3>
          <p className="text-sm text-[#78716c]">
            Your deposit tracker will appear here once you have an active booking
          </p>
        </div>
      </div>
    );

  const pct = depositPercentage(deposit.current_balance, deposit.original_amount);
  const deducted = deposit.original_amount - deposit.current_balance;
  const pendingDeductions =
    deposit.deductions?.filter((d: DepositDeduction) => d.status === "pending") || [];
  const booking = deposit.booking;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">
          Deposit Tracker
        </h1>
        <p className="text-sm text-[#78716c] mt-0.5">
          Your security deposit at a glance
        </p>
      </div>

      {/* Main deposit card */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#1c1917] to-[#292524] p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#a8a29e] text-sm mb-1">
                Current deposit balance
              </p>
              <div className="font-display text-4xl font-semibold">
                {formatCurrency(deposit.current_balance)}
              </div>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 text-right">
              <span className="text-white/60 text-xs">of original </span>
              <span className="font-semibold text-sm">
                {formatCurrency(deposit.original_amount)}
              </span>
            </div>
          </div>

          <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                pct > 75
                  ? "bg-green-400"
                  : pct > 40
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>{pct}% remaining</span>
            {deducted > 0 && (
              <span className="text-red-300">
                −{formatCurrency(deducted)} deducted
              </span>
            )}
          </div>
        </div>

        {/* Booking info */}
        <div className="px-5 py-4 border-b border-[#f5f5f4]">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium text-[#1c1917]">
                {booking?.listing?.title}
              </div>
              <div className="text-[#a8a29e] text-xs">
                {booking?.listing?.area}
              </div>
            </div>
            <div className="text-right text-xs text-[#78716c]">
              <div>Owner: {booking?.owner?.full_name}</div>
              <div>{booking?.owner?.phone}</div>
            </div>
          </div>
        </div>

        {/* Pending deductions alert */}
        {pendingDeductions.length > 0 && (
          <div className="mx-5 my-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {pendingDeductions.length} deduction
                {pendingDeductions.length > 1 ? "s" : ""} awaiting your
                response
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Review and approve or dispute the deductions below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Deductions history */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f5f5f4]">
          <h2 className="font-display font-semibold text-[#1c1917]">
            Deduction History
          </h2>
        </div>

        {!deposit.deductions || deposit.deductions.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#a8a29e]">
            No deductions have been raised yet.
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f4]">
            {deposit.deductions.map(
              (d: DeductionWithOwner) => {
                const statusCfg = DEDUCTION_STATUS_CONFIG[d.status];
                return (
                  <div key={d.id} className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                          <span className="text-xs text-[#a8a29e]">
                            {formatRelative(d.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-[#1c1917] font-medium">
                          {d.reason}
                        </p>
                        <p className="text-xs text-[#a8a29e] mt-0.5">
                          Raised by {d.raised_by?.full_name}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div
                          className={`font-semibold ${
                            d.status === "approved"
                              ? "text-red-500"
                              : "text-[#57534e]"
                          }`}
                        >
                          −{formatCurrency(d.amount)}
                        </div>
                      </div>
                    </div>

                    {d.tenant_response && (
                      <div className="bg-[#f5f5f4] rounded-lg px-3 py-2 text-xs text-[#57534e] mb-3">
                        <span className="font-medium">Your response: </span>
                        {d.tenant_response}
                      </div>
                    )}

                    {d.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approveDeduction(d)}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setDisputeForm(d)}
                          className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dispute
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e5e4]">
              <h2 className="font-display text-lg font-semibold text-[#1c1917]">
                Dispute Deduction
              </h2>
              <button
                onClick={() => setDisputeForm(null)}
                className="p-1.5 text-[#a8a29e] hover:text-[#1c1917] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#f5f5f4] rounded-xl p-4">
                <div className="text-sm font-medium text-[#1c1917]">
                  {disputeForm.reason}
                </div>
                <div className="text-sm font-semibold text-red-500 mt-1">
                  −{formatCurrency(disputeForm.amount)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Why are you disputing this? *
                </label>
                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  placeholder="Explain clearly why this deduction is unfair or incorrect..."
                  className="w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-[#e7e5e4]">
              <button
                onClick={() => setDisputeForm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-[#57534e] hover:text-[#1c1917] border border-[#e7e5e4] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}