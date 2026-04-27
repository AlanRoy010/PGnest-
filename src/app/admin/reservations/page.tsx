"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/utils";
import { Loader2, BookOpen, Check, X, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SHARING_LABELS: Record<number, string> = {
  1: "Single Room", 2: "Double Sharing", 3: "Triple Sharing",
  4: "4-Sharing", 5: "5-Sharing", 6: "6-Sharing",
};

interface ReservationWithDetails {
  id: string;
  bed_id: string;
  status: "pending" | "approved" | "rejected";
  tenant_message: string | null;
  created_at: string;
  bed: { bed_number: number; room: { room_number: string } | null } | null;
  floor: { floor_label: string } | null;
  sharing_type: { sharing_type: number; rent_per_person: number } | null;
  listing: { title: string; area: string } | null;
  tenant: { full_name: string; email: string | null; phone: string | null } | null;
}

const STATUS_CONFIG = {
  pending:  { label: "Pending",      cls: "bg-yellow-50 text-yellow-700" },
  approved: { label: "Approved",     cls: "bg-green-50 text-green-700" },
  rejected: { label: "Not Approved", cls: "bg-red-50 text-red-600" },
};

export default function AdminReservationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { loading: userLoading } = useUser();

  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    const { data } = await supabase
      .from("bed_reservations")
      .select(`
        id, bed_id, status, tenant_message, created_at,
        bed:listing_beds!bed_reservations_bed_id_fkey(
          bed_number,
          room:listing_rooms!listing_beds_room_id_fkey(room_number)
        ),
        floor:listing_floors!bed_reservations_floor_id_fkey(floor_label),
        sharing_type:listing_sharing_types!bed_reservations_sharing_type_id_fkey(sharing_type, rent_per_person),
        listing:listings!bed_reservations_listing_id_fkey(title, area),
        tenant:profiles!bed_reservations_tenant_id_fkey(full_name, email, phone)
      `)
      .order("created_at", { ascending: false });
    setReservations((data as unknown as ReservationWithDetails[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!userLoading) fetchReservations();
  }, [userLoading, fetchReservations]);

  const approve = async (r: ReservationWithDetails) => {
    setActionId(r.id);
    const { error: resErr } = await supabase
      .from("bed_reservations")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", r.id);
    if (resErr) { toast.error("Failed to approve"); setActionId(null); return; }

    await supabase
      .from("listing_beds")
      .update({ status: "occupied" })
      .eq("id", r.bed_id);

    toast.success("Reservation approved!");
    setReservations(prev =>
      prev.map(x => x.id === r.id ? { ...x, status: "approved" } : x)
    );
    setActionId(null);
  };

  const reject = async (r: ReservationWithDetails) => {
    setActionId(r.id);
    const { error: resErr } = await supabase
      .from("bed_reservations")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", r.id);
    if (resErr) { toast.error("Failed to reject"); setActionId(null); return; }

    await supabase
      .from("listing_beds")
      .update({ status: "available", reserved_by: null, reserved_at: null })
      .eq("id", r.bed_id);

    toast.success("Reservation rejected");
    setReservations(prev =>
      prev.map(x => x.id === r.id ? { ...x, status: "rejected" } : x)
    );
    setActionId(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">Bed Reservations</h1>
        <p className="text-sm text-[#78716c] mt-0.5">
          {reservations.length} reservation{reservations.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e7e5e4] rounded-2xl">
          <BookOpen className="w-10 h-10 text-[#d6d3d1] mx-auto mb-4" />
          <h3 className="font-display font-semibold text-[#1c1917] mb-1">No reservations yet</h3>
          <p className="text-sm text-[#78716c]">Tenant bed reservations will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => {
            const status = STATUS_CONFIG[r.status];
            const isPending = r.status === "pending";
            const isActioning = actionId === r.id;

            return (
              <div key={r.id} className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Tenant */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#fed7aa] flex items-center justify-center text-xs font-semibold text-[#c2410c] flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-[#1c1917]">
                        {r.tenant?.full_name || "Unknown"}
                      </div>
                      <div className="text-xs text-[#78716c]">{r.tenant?.email}</div>
                      {r.tenant?.phone && (
                        <div className="text-xs text-[#78716c]">{r.tenant.phone}</div>
                      )}
                    </div>
                  </div>

                  {/* Property */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[#1c1917] truncate">
                      {r.listing?.title || "—"}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#a8a29e] mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {r.listing?.area}, Mumbai
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#57534e]">
                      {r.floor?.floor_label}
                    </div>
                    <div className="text-xs text-[#78716c]">
                      Room {r.bed?.room?.room_number} · Bed {r.bed?.bed_number}
                    </div>
                    <div className="text-xs text-[#78716c]">
                      {r.sharing_type ? SHARING_LABELS[r.sharing_type.sharing_type] : "—"}
                    </div>
                    {r.sharing_type && (
                      <div className="text-xs font-semibold text-[#1c1917] mt-0.5">
                        {formatCurrency(r.sharing_type.rent_per_person)}/mo
                      </div>
                    )}
                  </div>

                  {/* Status + Date */}
                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-[#a8a29e]">
                      {format(new Date(r.created_at), "d MMM yyyy, h:mm a")}
                    </span>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approve(r)}
                        disabled={!!actionId}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => reject(r)}
                        disabled={!!actionId}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {r.tenant_message && (
                  <div className="mt-3 pt-3 border-t border-[#f5f5f4]">
                    <span className="text-xs text-[#78716c]">Message: </span>
                    <span className="text-xs text-[#57534e] italic">&ldquo;{r.tenant_message}&rdquo;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
