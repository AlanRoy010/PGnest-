"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/utils";
import { Loader2, BookOpen, MapPin } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

const SHARING_LABELS: Record<number, string> = {
  1: "Single Room", 2: "Double Sharing", 3: "Triple Sharing",
  4: "4-Sharing", 5: "5-Sharing", 6: "6-Sharing",
};

interface TenantReservation {
  id: string;
  status: "pending" | "approved" | "rejected";
  tenant_message: string | null;
  created_at: string;
  bed: { bed_number: number; room: { room_number: string } | null } | null;
  floor: { floor_label: string } | null;
  sharing_type: { sharing_type: number; rent_per_person: number } | null;
  listing: { title: string; area: string } | null;
}

const STATUS_CONFIG = {
  pending:  { label: "Awaiting Confirmation", cls: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  approved: { label: "Confirmed ✓",           cls: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Not Approved",          cls: "bg-red-50 text-red-600 border border-red-200" },
};

export default function TenantBookingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: userLoading } = useUser();

  const [reservations, setReservations] = useState<TenantReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    if (!profile) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from("bed_reservations")
        .select(`
          id, status, tenant_message, created_at,
          bed:listing_beds!bed_reservations_bed_id_fkey(
            bed_number,
            room:listing_rooms!listing_beds_room_id_fkey(room_number)
          ),
          floor:listing_floors!bed_reservations_floor_id_fkey(floor_label),
          sharing_type:listing_sharing_types!bed_reservations_sharing_type_id_fkey(sharing_type, rent_per_person),
          listing:listings!bed_reservations_listing_id_fkey(title, area)
        `)
        .eq("tenant_id", profile.id)
        .order("created_at", { ascending: false });
      setReservations((data as unknown as TenantReservation[]) || []);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile]);

  useEffect(() => {
    if (!userLoading) fetchReservations();
  }, [userLoading, fetchReservations]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">My Bookings</h1>
        <p className="text-sm text-[#78716c] mt-0.5">Your bed reservation history</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#e7e5e4] rounded-2xl">
          <BookOpen className="w-10 h-10 text-[#d6d3d1] mx-auto mb-4" />
          <h3 className="font-display font-semibold text-[#1c1917] mb-1">
            No reservations yet
          </h3>
          <p className="text-sm text-[#78716c] mb-6">
            You haven&apos;t reserved any beds yet
          </p>
          <Link
            href="/tenant/search"
            className="inline-flex items-center gap-2 bg-[#ea6c0a] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors"
          >
            Find a PG
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(r => {
            const status = STATUS_CONFIG[r.status];
            return (
              <div key={r.id} className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-medium text-[#1c1917]">
                      {r.listing?.title || "—"}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#a8a29e] mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {r.listing?.area}, Mumbai
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.cls}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-[#78716c]">Location</div>
                    <div className="font-medium text-[#1c1917]">
                      {r.floor?.floor_label}
                    </div>
                    <div className="text-xs text-[#57534e]">
                      Room {r.bed?.room?.room_number} · Bed B{r.bed?.bed_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#78716c]">Room Type</div>
                    <div className="font-medium text-[#1c1917]">
                      {r.sharing_type ? SHARING_LABELS[r.sharing_type.sharing_type] : "—"}
                    </div>
                    {r.sharing_type && (
                      <div className="text-xs text-[#57534e]">
                        {formatCurrency(r.sharing_type.rent_per_person)}/month
                      </div>
                    )}
                  </div>
                </div>

                {r.tenant_message && (
                  <div className="mt-3 pt-3 border-t border-[#f5f5f4] text-xs text-[#78716c]">
                    Your message: <span className="italic text-[#57534e]">&ldquo;{r.tenant_message}&rdquo;</span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#f5f5f4] text-xs text-[#a8a29e]">
                  Requested on {format(new Date(r.created_at), "d MMM yyyy, h:mm a")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
