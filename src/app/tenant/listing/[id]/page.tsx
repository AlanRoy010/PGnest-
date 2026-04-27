"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS } from "@/lib/utils";
import {
  MapPin, Users, Home, ArrowLeft, Phone,
  Loader2, CheckCircle, Calendar, X, Clock, BedDouble,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import type { Listing } from "@/types";

type OwnerSnippet = { full_name: string; phone: string | null };
type ListingWithOwner = Omit<Listing, "owner"> & { owner?: OwnerSnippet | null };

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const SHARING_LABELS: Record<number, string> = {
  1: "Single Room", 2: "Double Sharing", 3: "Triple Sharing",
  4: "4-Sharing", 5: "5-Sharing", 6: "6-Sharing",
};

// ─── Types for bed reservation system ───────────────────────────────────────

interface Floor {
  id: string;
  floor_number: number;
  floor_label: string;
}

interface SharingTypeWithCounts {
  id: string;
  sharing_type: number;
  rent_per_person: number;
  beds_per_room: number;
  is_active: boolean;
  total_beds: number;
  available_beds: number;
}

interface BedWithRoom {
  id: string;
  bed_number: number;
  status: "available" | "pending" | "occupied";
  reserved_by: string | null;
  room_id: string;
  room: { room_number: string } | null;
}

interface RawSharingType {
  id: string;
  sharing_type: number;
  rent_per_person: number;
  beds_per_room: number;
  is_active: boolean;
  beds: { id: string; status: string }[];
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const { profile } = useUser();

  const [listing, setListing] = useState<ListingWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  // Visit modal state
  const [showVisit, setShowVisit] = useState(false);
  const [visitName, setVisitName] = useState("");
  const [visitEmail, setVisitEmail] = useState("");
  const [visitPhone, setVisitPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitBooked, setVisitBooked] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, owner:profiles!listings_owner_id_fkey(full_name, phone)")
        .eq("id", params.id)
        .single();
      setListing(data);
      setLoading(false);
    };
    fetchListing();
  }, [params.id, supabase]);

  // Pre-fill user details
  useEffect(() => {
    const prefillDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (profile) {
        setVisitName(profile.full_name || "");
        setVisitPhone(profile.phone || "");
        setVisitEmail(profile.email || user?.email || "");
      } else if (user?.email) {
        setVisitEmail(user.email);
      }
    };
    prefillDetails();
  }, [profile, supabase]);

  const closeVisitModal = () => {
    setShowVisit(false);
    setVisitBooked(false);
    setVisitDate("");
    setVisitTime("");
  };

  const submitVisit = async () => {
    if (!visitName.trim()) { toast.error("Enter your name"); return; }
    if (!visitEmail.trim()) { toast.error("Enter your email"); return; }
    if (!visitPhone.trim()) { toast.error("Enter your phone number"); return; }
    if (!visitDate) { toast.error("Select a date"); return; }
    if (!visitTime) { toast.error("Select a time slot"); return; }

    setVisitLoading(true);
    const res = await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listing!.id,
        listing_title: listing!.title,
        listing_area: listing!.area,
        full_name: visitName,
        email: visitEmail,
        phone: visitPhone,
        visit_date: visitDate,
        visit_time: visitTime,
        user_id: profile?.id || null,
        owner_phone: listing!.owner?.phone || null,
        owner_name: listing!.owner?.full_name || null,
      }),
    });
    setVisitLoading(false);

    if (!res.ok) { toast.error("Failed to schedule visit. Try again."); return; }
    setVisitBooked(true);
  };

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
    </div>
  );

  if (!listing) return (
    <div className="text-center py-20">
      <p className="text-[#78716c]">Listing not found.</p>
      <Link href="/tenant/search" className="text-[#ea6c0a] text-sm mt-2 inline-block hover:underline">
        ← Back to search
      </Link>
    </div>
  );

  const owner = listing.owner;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/tenant/search"
        className="inline-flex items-center gap-1.5 text-sm text-[#78716c] hover:text-[#1c1917] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      {/* Photos */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden mb-6">
        <div className="h-64 md:h-80 bg-gradient-to-br from-[#fed7aa] to-[#fdba74] relative overflow-hidden">
          {listing.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[activePhoto]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-[#c2410c] opacity-30" />
            </div>
          )}
        </div>

        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {listing.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  activePhoto === i ? "border-[#ea6c0a]" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display text-xl font-semibold text-[#1c1917]">
                {listing.title}
              </h1>
              {listing.gender_preference !== "any" && (
                <span className="flex-shrink-0 text-xs bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] px-2.5 py-1 rounded-full font-medium">
                  {listing.gender_preference === "male" ? "👨 Male only" : "👩 Female only"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-[#78716c] mb-4">
              <MapPin className="w-4 h-4" />
              {listing.address || listing.area}, Mumbai — {listing.pincode}
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-[#57534e]">
                <Home className="w-4 h-4 text-[#a8a29e]" />
                <span className="capitalize">{listing.room_type} room</span>
              </span>
              <span className="flex items-center gap-1.5 text-[#57534e]">
                <Users className="w-4 h-4 text-[#a8a29e]" />
                {listing.rooms_available * (listing.beds_per_room || 1)} beds available
              </span>
              <span className="text-[#57534e] capitalize">{listing.furnishing}</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
            <h2 className="font-display font-semibold text-[#1c1917] mb-3">About this PG</h2>
            <p className="text-sm text-[#57534e] leading-relaxed">{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
              <h2 className="font-display font-semibold text-[#1c1917] mb-3">Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm text-[#57534e]">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {AMENITY_LABELS[a] || a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {listing.rules.length > 0 && (
            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
              <h2 className="font-display font-semibold text-[#1c1917] mb-3">House rules</h2>
              <div className="space-y-2">
                {listing.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#57534e]">
                    <span className="w-1.5 h-1.5 bg-[#a8a29e] rounded-full flex-shrink-0" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
            <div className="mb-4">
              <div className="font-display text-2xl font-semibold text-[#1c1917]">
                {formatCurrency(listing.monthly_rent)}
              </div>
              <div className="text-xs text-[#78716c]">per month</div>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-t border-[#f5f5f4]">
              <span className="text-[#78716c]">Security deposit</span>
              <span className="font-medium text-[#1c1917]">
                {formatCurrency(listing.security_deposit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-t border-[#f5f5f4]">
              <span className="text-[#78716c]">Beds available</span>
              <span className="font-medium text-[#1c1917]">
                {listing.rooms_available * (listing.beds_per_room || 1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-t border-[#f5f5f4]">
              <span className="text-[#78716c]">Room type</span>
              <span className="font-medium text-[#1c1917] capitalize">
                {listing.room_type} ({listing.beds_per_room || 1} bed{(listing.beds_per_room || 1) > 1 ? "s" : ""})
              </span>
            </div>

            <button
              onClick={() => setShowVisit(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Schedule a visit
            </button>
          </div>

          {/* Owner info */}
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
            <h3 className="font-medium text-[#1c1917] text-sm mb-3">Listed by</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#fed7aa] flex items-center justify-center text-sm font-semibold text-[#c2410c]">
                {owner?.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <div className="text-sm font-medium text-[#1c1917]">{owner?.full_name}</div>
                {owner?.phone && (
                  <div className="flex items-center gap-1 text-xs text-[#78716c] mt-0.5">
                    <Phone className="w-3 h-3" />
                    {owner.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cinema-Style Bed Reservation ─────────────────────────────────── */}
      <BedReservationSection
        listingId={listing.id}
        userId={profile?.id ?? null}
      />

      {/* Schedule Visit Modal */}
      {showVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-auto animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e5e4]">
              <h2 className="font-display text-lg font-semibold text-[#1c1917]">
                {visitBooked ? "Visit confirmed!" : "Schedule a visit"}
              </h2>
              <button
                onClick={closeVisitModal}
                className="p-1.5 text-[#a8a29e] hover:text-[#1c1917] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {visitBooked ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-display text-xl font-semibold text-[#1c1917] mb-2">
                  You&apos;re all set!
                </h3>
                <p className="text-sm text-[#78716c] mb-3">
                  Your visit to <strong>{listing.title}</strong> is booked for
                </p>
                <div className="bg-[#fff7ed] rounded-xl p-4 mb-4 text-left space-y-1">
                  <p className="text-sm font-semibold text-[#c2410c]">{listing.title}</p>
                  <p className="text-sm text-[#57534e]">
                    📅 {new Date(visitDate).toLocaleDateString("en-IN", {
                      weekday: "long", year: "numeric",
                      month: "long", day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-[#57534e]">🕐 {visitTime}</p>
                  <p className="text-sm text-[#57534e]">📍 {listing.area}, Mumbai</p>
                </div>
                <p className="text-xs text-[#a8a29e] mb-5">
                  A confirmation has been sent to <strong>{visitEmail}</strong>
                </p>
                <button
                  onClick={closeVisitModal}
                  className="w-full py-2.5 bg-[#f5f5f4] text-[#57534e] rounded-xl text-sm font-medium hover:bg-[#e7e5e4] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="bg-[#fff7ed] rounded-xl p-3">
                  <p className="text-xs font-medium text-[#c2410c]">{listing.title}</p>
                  <p className="text-xs text-[#78716c]">{listing.area}, Mumbai</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">Full name *</label>
                    <input type="text" value={visitName} onChange={(e) => setVisitName(e.target.value)}
                      placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">Phone *</label>
                    <input type="tel" value={visitPhone} onChange={(e) => setVisitPhone(e.target.value)}
                      placeholder="98765 43210" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534e] mb-1.5">Email *</label>
                  <input type="email" value={visitEmail} onChange={(e) => setVisitEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534e] mb-1.5">Select date *</label>
                  <input type="date" value={visitDate} min={minDateStr}
                    onChange={(e) => { setVisitDate(e.target.value); setVisitTime(""); }}
                    className={inputCls} />
                </div>

                {visitDate && (
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-2">Select time *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button key={slot} type="button" onClick={() => setVisitTime(slot)}
                          className={`flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            visitTime === slot
                              ? "bg-[#fff7ed] border-[#ea6c0a] text-[#c2410c]"
                              : "border-[#e7e5e4] text-[#57534e] hover:border-[#a8a29e]"
                          }`}>
                          <Clock className="w-3 h-3" />{slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={closeVisitModal}
                    className="flex-1 py-2.5 text-sm font-medium text-[#57534e] border border-[#e7e5e4] rounded-xl hover:bg-[#f5f5f4] transition-colors">
                    Cancel
                  </button>
                  <button onClick={submitVisit} disabled={visitLoading || !visitDate || !visitTime}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50">
                    {visitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4" /> Confirm visit</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bed Reservation Section ─────────────────────────────────────────────────

function BedReservationSection({
  listingId,
  userId,
}: {
  listingId: string;
  userId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [sharingTypes, setSharingTypes] = useState<SharingTypeWithCounts[]>([]);
  const [selectedSTId, setSelectedSTId] = useState<string | null>(null);
  const [selectedST, setSelectedST] = useState<SharingTypeWithCounts | null>(null);
  const [beds, setBeds] = useState<BedWithRoom[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [tenantMessage, setTenantMessage] = useState("");
  const [loadingFloors, setLoadingFloors] = useState(true);
  const [loadingST, setLoadingST] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [reserving, setReserving] = useState(false);

  // Fetch floors with active sharing types
  const fetchFloors = useCallback(async () => {
    setLoadingFloors(true);
    const { data } = await supabase
      .from("listing_floors")
      .select("id, floor_number, floor_label, listing_sharing_types(id, is_active)")
      .eq("listing_id", listingId)
      .order("floor_number");

    interface RawFloor {
      id: string;
      floor_number: number;
      floor_label: string;
      listing_sharing_types: { id: string; is_active: boolean }[];
    }

    const active = ((data as RawFloor[]) || []).filter(f =>
      f.listing_sharing_types?.some(st => st.is_active)
    );
    const cleaned: Floor[] = active.map(f => ({
      id: f.id,
      floor_number: f.floor_number,
      floor_label: f.floor_label,
    }));
    setFloors(cleaned);
    setLoadingFloors(false);
    return cleaned;
  }, [supabase, listingId]);

  useEffect(() => {
    fetchFloors().then(f => {
      if (f.length > 0) setSelectedFloorId(f[0].id);
    });
  }, [fetchFloors]);

  // Fetch sharing types when floor selected
  const fetchSharingTypes = useCallback(async (floorId: string) => {
    setLoadingST(true);
    setSharingTypes([]);
    setSelectedSTId(null);
    setSelectedST(null);
    setBeds([]);
    setSelectedBedId(null);

    const { data } = await supabase
      .from("listing_sharing_types")
      .select("id, sharing_type, rent_per_person, beds_per_room, is_active, beds:listing_beds(id, status)")
      .eq("floor_id", floorId)
      .eq("is_active", true);

    const processed: SharingTypeWithCounts[] = ((data as RawSharingType[]) || []).map(st => ({
      id: st.id,
      sharing_type: st.sharing_type,
      rent_per_person: st.rent_per_person,
      beds_per_room: st.beds_per_room,
      is_active: st.is_active,
      total_beds: st.beds?.length || 0,
      available_beds: (st.beds || []).filter(b => b.status === "available").length,
    }));
    setSharingTypes(processed);
    setLoadingST(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedFloorId) fetchSharingTypes(selectedFloorId);
  }, [selectedFloorId, fetchSharingTypes]);

  // Fetch beds when sharing type selected
  const fetchBeds = useCallback(async (stId: string) => {
    setLoadingBeds(true);
    setBeds([]);
    setSelectedBedId(null);

    const { data } = await supabase
      .from("listing_beds")
      .select("id, bed_number, status, reserved_by, room_id, room:listing_rooms!listing_beds_room_id_fkey(room_number)")
      .eq("sharing_type_id", stId)
      .order("bed_number");

    setBeds((data as unknown as BedWithRoom[]) || []);
    setLoadingBeds(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedSTId) fetchBeds(selectedSTId);
  }, [selectedSTId, fetchBeds]);

  const selectSharingType = (st: SharingTypeWithCounts) => {
    if (st.available_beds === 0) return;
    setSelectedSTId(st.id);
    setSelectedST(st);
  };

  const handleReserve = async () => {
    if (!userId) return;
    if (!selectedBedId || !selectedSTId || !selectedFloorId) return;

    setReserving(true);
    const { error: resErr } = await supabase.from("bed_reservations").insert({
      bed_id: selectedBedId,
      listing_id: listingId,
      floor_id: selectedFloorId,
      sharing_type_id: selectedSTId,
      tenant_id: userId,
      status: "pending",
      tenant_message: tenantMessage.trim() || null,
    });

    if (resErr) {
      toast.error("Failed to reserve bed. Try again.");
      setReserving(false);
      return;
    }

    const { error: bedErr } = await supabase
      .from("listing_beds")
      .update({ status: "pending", reserved_by: userId, reserved_at: new Date().toISOString() })
      .eq("id", selectedBedId);

    if (bedErr) console.error("bed update error", bedErr);

    toast.success("Bed reserved! The owner will confirm your booking shortly.");

    // Update UI immediately
    setBeds(prev =>
      prev.map(b => b.id === selectedBedId ? { ...b, status: "pending", reserved_by: userId } : b)
    );
    setSelectedBedId(null);
    setTenantMessage("");
    setReserving(false);

    // Refresh sharing type counts
    if (selectedFloorId) fetchSharingTypes(selectedFloorId);
  };

  // Group beds by room
  const bedsGrouped = useMemo(() => {
    const groups: Record<string, { room_number: string; beds: BedWithRoom[] }> = {};
    beds.forEach(bed => {
      if (!groups[bed.room_id]) {
        groups[bed.room_id] = {
          room_number: bed.room?.room_number || bed.room_id.slice(0, 8),
          beds: [],
        };
      }
      groups[bed.room_id].beds.push(bed);
    });
    return groups;
  }, [beds]);

  const selectedBed = beds.find(b => b.id === selectedBedId);
  const selectedFloor = floors.find(f => f.id === selectedFloorId);

  if (loadingFloors) return (
    <div className="mt-6 bg-white border border-[#e7e5e4] rounded-2xl p-6 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-[#ea6c0a]" />
    </div>
  );

  if (floors.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <BedDouble className="w-5 h-5 text-[#ea6c0a]" />
          <h2 className="font-display text-lg font-semibold text-[#1c1917]">Choose Your Bed</h2>
        </div>

        {/* Step 1: Floor tabs (only if >1 floor) */}
        {floors.length > 1 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#57534e] mb-2">Select Floor</p>
            <div className="flex gap-2 flex-wrap">
              {floors.map(floor => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedFloorId === floor.id
                      ? "bg-[#fff7ed] border-[#ea6c0a] text-[#c2410c]"
                      : "border-[#e7e5e4] text-[#57534e] hover:border-[#a8a29e]"
                  }`}
                >
                  {floor.floor_label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Sharing type cards */}
        {loadingST ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#ea6c0a]" />
          </div>
        ) : sharingTypes.length > 0 ? (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#57534e] mb-2">Select Room Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sharingTypes.map(st => {
                const unavailable = st.available_beds === 0;
                const selected = selectedSTId === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => selectSharingType(st)}
                    disabled={unavailable}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-[#ea6c0a] bg-[#fff7ed]"
                        : unavailable
                          ? "border-[#e7e5e4] opacity-50 cursor-not-allowed bg-[#fafaf9]"
                          : "border-[#e7e5e4] hover:border-[#ea6c0a] bg-white"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${selected ? "text-[#c2410c]" : "text-[#1c1917]"}`}>
                      {SHARING_LABELS[st.sharing_type]}
                    </div>
                    <div className={`text-xs ${selected ? "text-[#ea6c0a]" : "text-[#57534e]"}`}>
                      {formatCurrency(st.rent_per_person)}/mo
                    </div>
                    <div className={`text-xs mt-1 ${
                      unavailable ? "text-[#a8a29e]" : "text-green-600"
                    }`}>
                      {unavailable ? "No beds available" : `${st.available_beds} bed${st.available_beds !== 1 ? "s" : ""} free`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Step 3: Cinema-style bed grid */}
        {selectedSTId && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[#57534e] mb-1">
              {selectedFloor?.floor_label} — {selectedST ? SHARING_LABELS[selectedST.sharing_type] : ""}
            </p>
            <p className="text-xs text-[#a8a29e] mb-3 flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#ea6c0a] inline-block" /> Pending</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Selected</span>
            </p>

            {loadingBeds ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#ea6c0a]" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(bedsGrouped).map(group => (
                  <div key={group.room_number} className="bg-[#fafaf9] border border-[#e7e5e4] rounded-xl p-3">
                    <div className="text-xs font-medium text-[#78716c] mb-2">Room {group.room_number}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.beds.map(bed => {
                        const isSelected = selectedBedId === bed.id;
                        const isMyPending = bed.reserved_by === userId && bed.status === "pending";

                        let bgColor = "bg-green-500 hover:bg-green-600 cursor-pointer";
                        let title = "Click to select";
                        let content: React.ReactNode = `B${bed.bed_number}`;

                        if (isSelected) {
                          bgColor = "bg-blue-500 cursor-pointer";
                          content = <><span className="text-[9px] block">B{bed.bed_number}</span><CheckCircle className="w-3 h-3 mx-auto" /></>;
                        } else if (bed.status === "pending") {
                          bgColor = isMyPending
                            ? "bg-blue-400 cursor-default"
                            : "bg-[#ea6c0a] cursor-not-allowed";
                          title = isMyPending ? "Your reservation" : "Reserved";
                          content = `B${bed.bed_number}`;
                        } else if (bed.status === "occupied") {
                          bgColor = "bg-red-500 cursor-not-allowed";
                          title = "Occupied";
                        }

                        return (
                          <button
                            key={bed.id}
                            title={title}
                            disabled={bed.status !== "available" && !isSelected}
                            onClick={() => {
                              if (bed.status !== "available") return;
                              setSelectedBedId(prev => prev === bed.id ? null : bed.id);
                            }}
                            className={`w-10 h-10 rounded-full text-white text-[10px] font-semibold flex items-center justify-center flex-col transition-all ${bgColor}`}
                          >
                            {content}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 4: Reservation summary */}
      {selectedBedId && selectedST && selectedFloor && selectedBed && (
        <div className="bg-white border border-[#ea6c0a] rounded-2xl p-5">
          <h3 className="font-display font-semibold text-[#1c1917] mb-4">Reserve This Bed</h3>

          <div className="bg-[#fff7ed] rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[#78716c]">Floor</div>
              <div className="font-medium text-[#1c1917]">{selectedFloor.floor_label}</div>
            </div>
            <div>
              <div className="text-xs text-[#78716c]">Room</div>
              <div className="font-medium text-[#1c1917]">{selectedBed.room?.room_number}</div>
            </div>
            <div>
              <div className="text-xs text-[#78716c]">Bed</div>
              <div className="font-medium text-[#1c1917]">Bed {selectedBed.bed_number}</div>
            </div>
            <div>
              <div className="text-xs text-[#78716c]">Type</div>
              <div className="font-medium text-[#1c1917]">{SHARING_LABELS[selectedST.sharing_type]}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-[#78716c]">Rent per month</div>
              <div className="font-semibold text-[#ea6c0a] text-lg">
                {formatCurrency(selectedST.rent_per_person)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-[#57534e] mb-1.5">
              Message to owner (optional)
            </label>
            <textarea
              value={tenantMessage}
              onChange={e => setTenantMessage(e.target.value)}
              rows={2}
              placeholder="Any questions or notes for the owner..."
              className="w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e] resize-none"
            />
          </div>

          {userId ? (
            <button
              onClick={handleReserve}
              disabled={reserving}
              className="w-full flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50"
            >
              {reserving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BedDouble className="w-4 h-4" />}
              Reserve This Bed
            </button>
          ) : (
            <div className="text-center py-3 bg-[#fafaf9] rounded-xl border border-[#e7e5e4]">
              <p className="text-sm text-[#78716c] mb-2">Please sign in to reserve a bed</p>
              <Link
                href="/login"
                className="text-sm text-[#ea6c0a] font-medium hover:underline"
              >
                Sign in →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]";
