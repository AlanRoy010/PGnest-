"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS } from "@/lib/utils";
import {
  MapPin, Users, Home, ArrowLeft, Phone,
  Loader2, CheckCircle, Calendar, X, Clock, BedDouble,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import type { Listing } from "@/types";
import FallingFeathers, { spawnFeathers, FeatherSVG } from "@/components/FallingFeathers";
import { Magnetic } from "@/components/FeatherFX";

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

interface BedCell {
  id: string;
  bed_number: number;
  status: "available" | "pending" | "occupied";
  reserved_by: string | null;
}

interface RoomRow {
  room_id: string;
  room_number: string;
  sharing_type_id: string;
  floor_id: string;
  sharing_type: number;
  rent_per_person: number;
  beds: BedCell[];
}

interface FloorSection {
  floor_id: string;
  floor_label: string;
  floor_number: number;
  rooms: RoomRow[];
}

interface RawRoom {
  id: string;
  room_number: string;
  floor_id: string;
  sharing_type_id: string;
  floor: { id: string; floor_label: string; floor_number: number } | null;
  sharing_type: { sharing_type: number; rent_per_person: number; is_active: boolean } | null;
  beds: { id: string; bed_number: number; status: string; reserved_by: string | null }[];
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ListingDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const isLoggedIn = !userLoading && profile !== null;

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
  const [feathers, setFeathers] = useState<ReturnType<typeof spawnFeathers>>([]);

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

  const redirectToAuth = (dest: "/login" | "/signup" = "/login") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("redirect_after_auth", window.location.href);
    }
    router.push(dest);
  };

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
    try {
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
      if (!res.ok) { toast.error("Failed to schedule visit. Try again."); return; }
      setVisitBooked(true);
      const f = spawnFeathers(16);
      setFeathers(f);
      setTimeout(() => setFeathers([]), 5000);
    } catch {
      toast.error("Failed to schedule visit. Try again.");
    } finally {
      setVisitLoading(false);
    }
  };

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#60a5fa]" />
    </div>
  );

  if (!listing) return (
    <div className="text-center py-20">
      <p style={{ color: "rgba(241,243,249,0.62)" }}>Listing not found.</p>
      <Link href="/tenant/search" style={{ color: "#60a5fa" }} className="text-sm mt-2 inline-block hover:underline">
        ← Back to search
      </Link>
    </div>
  );

  const owner = listing.owner;

  return (
    <div className="max-w-3xl mx-auto">
      <FallingFeathers feathers={feathers} />

      {/* Back button */}
      <Link
        href="/tenant/search"
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: "rgba(241,243,249,0.62)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to search
      </Link>

      {/* Photos */}
      <div className="rounded-2xl overflow-hidden mb-6 relative" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Iridescent top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-10" style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)" }} />
        <div className="h-64 md:h-80 bg-gradient-to-br from-[#6B7FA3] to-[#4A5A7A] relative overflow-hidden">
          {/* Feather watermark decorations */}
          <div className="absolute top-6 right-8 opacity-10 pointer-events-none">
            <FeatherSVG width={48} color="#fff" rotation={15} />
          </div>
          <div className="absolute bottom-8 left-6 opacity-8 pointer-events-none">
            <FeatherSVG width={32} color="#fff" rotation={-20} />
          </div>
          {listing.photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[activePhoto]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-white opacity-30" />
            </div>
          )}
        </div>

        {listing.photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {listing.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all`}
                style={{ borderColor: activePhoto === i ? "#60a5fa" : "transparent" }}
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
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="font-display text-xl font-semibold" style={{ color: "#e8ecf4" }}>
                {listing.title}
              </h1>
              {listing.gender_preference !== "any" && (
                <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa" }}>
                  {listing.gender_preference === "male" ? "👨 Male only" : "👩 Female only"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm mb-4" style={{ color: "rgba(241,243,249,0.62)" }}>
              <MapPin className="w-4 h-4" />
              {listing.address || listing.area}, Mumbai — {listing.pincode}
            </div>

            <div className="flex flex-wrap gap-3 text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4" style={{ color: "rgba(241,243,249,0.38)" }} />
                <span className="capitalize">{listing.room_type} room</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: "rgba(241,243,249,0.38)" }} />
                {listing.rooms_available * (listing.beds_per_room || 1)} beds available
              </span>
              <span className="capitalize">{listing.furnishing}</span>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 className="font-display font-semibold mb-3" style={{ color: "#e8ecf4" }}>About this PG</h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(241,243,249,0.62)" }}>{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="font-display font-semibold mb-3" style={{ color: "#e8ecf4" }}>Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "linear-gradient(120deg, #60a5fa, #34d399)" }} />
                    {AMENITY_LABELS[a] || a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {listing.rules.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 className="font-display font-semibold mb-3" style={{ color: "#e8ecf4" }}>House rules</h2>
              <div className="space-y-2">
                {listing.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.25)" }} />
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="mb-4">
              <div className="font-display text-2xl font-semibold" style={{ color: "#e8ecf4" }}>
                {formatCurrency(listing.monthly_rent)}
              </div>
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>per month · all inclusive</div>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "rgba(241,243,249,0.62)" }}>Security deposit</span>
              <span className="font-medium" style={{ color: "#e8ecf4" }}>{formatCurrency(listing.security_deposit)}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "rgba(241,243,249,0.62)" }}>Beds available</span>
              <span className="font-medium" style={{ color: "#e8ecf4" }}>{listing.rooms_available * (listing.beds_per_room || 1)}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "rgba(241,243,249,0.62)" }}>Room type</span>
              <span className="font-medium capitalize" style={{ color: "#e8ecf4" }}>
                {listing.room_type} ({listing.beds_per_room || 1} bed{(listing.beds_per_room || 1) > 1 ? "s" : ""})
              </span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginBottom: 4 }} />
            <div className="flex items-center justify-between text-sm py-1 mb-4">
              <span style={{ color: "rgba(241,243,249,0.62)" }}>Platform fee</span>
              <span className="font-medium" style={{ color: "#34d399" }}>₹0</span>
            </div>

            {isLoggedIn ? (
              <Magnetic strength={0.2} style={{ display: "block" }}>
                <button
                  onClick={() => setShowVisit(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-full"
                  style={{ background: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)", color: "#0a0c18", border: "none", cursor: "pointer", boxShadow: "0 0 32px rgba(96,165,250,0.27)" }}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule a visit
                </button>
              </Magnetic>
            ) : (
              <div className="mt-2 rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-medium mb-1" style={{ color: "#e8ecf4" }}>
                  Sign in to schedule a visit
                </p>
                <p className="text-xs mb-3" style={{ color: "rgba(241,243,249,0.38)" }}>
                  Book a tour of this PG in seconds
                </p>
                <div className="flex gap-2">
                  <button onClick={() => redirectToAuth("/login")} className="flex-1 py-2 text-xs font-semibold rounded-full" style={{ background: "linear-gradient(120deg, #a78bfa, #60a5fa)", color: "#0a0c18", border: "none", cursor: "pointer" }}>
                    Sign in
                  </button>
                  <button onClick={() => redirectToAuth("/signup")} className="flex-1 py-2 text-xs font-semibold rounded-full" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.62)", cursor: "pointer" }}>
                    Create account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Owner info */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: "#e8ecf4" }}>Listed by</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(120deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15))", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa" }}>
                {owner?.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "#e8ecf4" }}>{owner?.full_name}</div>
                {owner?.phone && (
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "rgba(241,243,249,0.38)" }}>
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
        isLoggedIn={isLoggedIn}
        onAuthRequired={redirectToAuth}
      />

      {/* Schedule Visit Modal */}
      {showVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md my-auto animate-scale-up overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            {/* Modal header */}
            <div className="relative p-5 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)" }} />
              <div className="absolute right-4 top-2 opacity-15 pointer-events-none">
                <FeatherSVG width={36} color="#fff" rotation={12} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <h2 className="font-display text-lg font-semibold" style={{ color: "#e8ecf4" }}>
                  {visitBooked ? "Visit confirmed!" : "Schedule a visit"}
                </h2>
                <button onClick={closeVisitModal} className="p-1.5 rounded-lg transition-colors" style={{ color: "rgba(241,243,249,0.6)", background: "none", border: "none", cursor: "pointer" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {visitBooked ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(120deg, rgba(52,211,153,0.2), rgba(96,165,250,0.12))", border: "1px solid rgba(52,211,153,0.3)" }}>
                  <CheckCircle className="w-8 h-8" style={{ color: "#34d399" }} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: "#e8ecf4" }}>You&apos;re all set!</h3>
                <p className="text-sm mb-3" style={{ color: "rgba(241,243,249,0.62)" }}>
                  Your visit to <strong style={{ color: "#e8ecf4" }}>{listing.title}</strong> is booked for
                </p>
                <div className="rounded-xl p-4 mb-4 text-left space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#60a5fa" }}>{listing.title}</p>
                  <p className="text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>
                    📅 {new Date(visitDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>🕐 {visitTime}</p>
                  <p className="text-sm" style={{ color: "rgba(241,243,249,0.62)" }}>📍 {listing.area}, Mumbai</p>
                </div>
                <p className="text-xs mb-5" style={{ color: "rgba(241,243,249,0.38)" }}>
                  A confirmation has been sent to <strong style={{ color: "#e8ecf4" }}>{visitEmail}</strong>
                </p>
                <button onClick={closeVisitModal} className="w-full py-2.5 text-sm font-semibold rounded-full" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.62)", cursor: "pointer" }}>
                  Close
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="rounded-xl p-3" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <p className="text-xs font-medium" style={{ color: "#60a5fa" }}>{listing.title}</p>
                  <p className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>{listing.area}, Mumbai</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(241,243,249,0.38)" }}>Full name *</label>
                    <input type="text" value={visitName} onChange={(e) => setVisitName(e.target.value)} placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(241,243,249,0.38)" }}>Phone *</label>
                    <input type="tel" value={visitPhone} onChange={(e) => setVisitPhone(e.target.value)} placeholder="98765 43210" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(241,243,249,0.38)" }}>Email *</label>
                  <input type="email" value={visitEmail} onChange={(e) => setVisitEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(241,243,249,0.38)" }}>Select date *</label>
                  <input type="date" value={visitDate} min={minDateStr} onChange={(e) => { setVisitDate(e.target.value); setVisitTime(""); }} className={inputCls} />
                </div>

                {visitDate && (
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "rgba(241,243,249,0.38)" }}>Select time *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button key={slot} type="button" onClick={() => setVisitTime(slot)}
                          className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            border: visitTime === slot ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
                            background: visitTime === slot ? "linear-gradient(120deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))" : "transparent",
                            color: visitTime === slot ? "#60a5fa" : "rgba(241,243,249,0.62)",
                            cursor: "pointer",
                          }}>
                          <Clock className="w-3 h-3" />{slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={closeVisitModal} className="flex-1 py-2.5 text-sm font-semibold rounded-full" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.62)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={submitVisit} disabled={visitLoading || !visitDate || !visitTime}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-full"
                    style={{ background: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)", color: "#0a0c18", border: "none", cursor: visitLoading || !visitDate || !visitTime ? "not-allowed" : "pointer", opacity: visitLoading || !visitDate || !visitTime ? 0.5 : 1 }}>
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
  isLoggedIn,
  onAuthRequired,
}: {
  listingId: string;
  userId: string | null;
  isLoggedIn: boolean;
  onAuthRequired: (dest?: "/login" | "/signup") => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [sections, setSections] = useState<FloorSection[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [tenantMessage, setTenantMessage] = useState("");
  const [reserving, setReserving] = useState(false);
  const [bedFeathers, setBedFeathers] = useState<ReturnType<typeof spawnFeathers>>([]);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("listing_rooms")
      .select(`
        id, room_number, floor_id, sharing_type_id,
        floor:listing_floors(id, floor_label, floor_number),
        sharing_type:listing_sharing_types(sharing_type, rent_per_person, is_active),
        beds:listing_beds(id, bed_number, status, reserved_by)
      `)
      .eq("listing_id", listingId)
      .order("room_number");

    const rawRooms = (data as unknown as RawRoom[]) || [];
    const floorMap = new Map<string, FloorSection>();

    rawRooms.forEach(room => {
      if (!room.floor || !room.sharing_type?.is_active) return;
      const fid = room.floor_id;
      if (!floorMap.has(fid)) {
        floorMap.set(fid, {
          floor_id: fid,
          floor_label: room.floor.floor_label,
          floor_number: room.floor.floor_number,
          rooms: [],
        });
      }
      floorMap.get(fid)!.rooms.push({
        room_id: room.id,
        room_number: room.room_number,
        sharing_type_id: room.sharing_type_id,
        floor_id: fid,
        sharing_type: room.sharing_type.sharing_type,
        rent_per_person: room.sharing_type.rent_per_person,
        beds: (room.beds || []).map(b => ({
          id: b.id,
          bed_number: b.bed_number,
          status: b.status as BedCell["status"],
          reserved_by: b.reserved_by,
        })),
      });
    });

    setSections(
      Array.from(floorMap.values()).sort((a, b) => a.floor_number - b.floor_number)
    );
  }, [supabase, listingId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedBedInfo = useMemo(() => {
    for (const section of sections) {
      for (const room of section.rooms) {
        const bed = room.beds.find(b => b.id === selectedBedId);
        if (bed) return { bed, room, floor: section };
      }
    }
    return null;
  }, [sections, selectedBedId]);

  const handleReserve = async () => {
    if (!userId || !selectedBedId || !selectedBedInfo) return;
    setReserving(true);
    try {
      const { error: resErr } = await supabase.from("bed_reservations").insert({
        bed_id: selectedBedId,
        listing_id: listingId,
        floor_id: selectedBedInfo.floor.floor_id,
        sharing_type_id: selectedBedInfo.room.sharing_type_id,
        tenant_id: userId,
        status: "pending",
        tenant_message: tenantMessage.trim() || null,
      });

      if (resErr) { toast.error("Failed to reserve bed. Try again."); return; }

      await supabase
        .from("listing_beds")
        .update({ status: "pending", reserved_by: userId, reserved_at: new Date().toISOString() })
        .eq("id", selectedBedId);

      toast.success("Bed reserved! The owner will confirm your booking shortly.");
      const f = spawnFeathers(18);
      setBedFeathers(f);
      setTimeout(() => setBedFeathers([]), 5000);

      setSections(prev => prev.map(section => ({
        ...section,
        rooms: section.rooms.map(room => ({
          ...room,
          beds: room.beds.map(bed =>
            bed.id === selectedBedId
              ? { ...bed, status: "pending" as const, reserved_by: userId }
              : bed
          ),
        })),
      })));
      setSelectedBedId(null);
      setTenantMessage("");
    } finally {
      setReserving(false);
    }
  };

  if (sections.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <FallingFeathers feathers={bedFeathers} />
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Iridescent top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)" }} />
        <div className="flex items-center gap-2 mb-4 mt-1">
          <BedDouble className="w-5 h-5" style={{ color: "#60a5fa" }} />
          <h2 className="font-display text-lg font-semibold" style={{ color: "#e8ecf4" }}>Choose Your Bed</h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mb-5 flex-wrap text-xs" style={{ color: "rgba(241,243,249,0.62)" }}>
          {[
            { label: "Available", stroke: "#9ca3af", fill: "#f9fafb", pillow: "white" },
            { label: "Pending",   stroke: "#E8734A", fill: "#FDF0EB", pillow: "#F9D5C4" },
            { label: "Occupied",  stroke: "#6b7280", fill: "#e5e7eb", pillow: "#9ca3af" },
            { label: "Selected",  stroke: "#6B7FA3", fill: "#F0F3F8", pillow: "white"  },
          ].map(({ label, stroke, fill, pillow }) => (
            <span key={label} className="flex items-center gap-1.5">
              <BedIcon stroke={stroke} fill={fill} pillowFill={pillow} size={20} />
              {label}
            </span>
          ))}
        </div>

        {/* Cinema grid — all floors at once */}
        <div className="space-y-6 overflow-x-auto">
          {sections.map(section => (
            <div key={section.floor_id}>
              {/* Floor section header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "rgba(241,243,249,0.38)" }}>
                  {section.floor_label}
                </span>
                <div className="flex-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
              </div>

              {/* Room rows */}
              <div className="space-y-2">
                {section.rooms.map(room => (
                  <div key={room.room_id} className="flex items-center gap-3 min-w-0">
                    {/* Row label */}
                    <div className="w-24 flex-shrink-0 text-right pr-1">
                      <div className="text-xs font-semibold" style={{ color: "#e8ecf4" }}>{room.room_number}</div>
                      <div className="text-[10px] leading-tight" style={{ color: "rgba(241,243,249,0.38)" }}>
                        {SHARING_LABELS[room.sharing_type]}
                      </div>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-12 flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />
                    {/* Bed icons */}
                    <div className="flex flex-wrap gap-2">
                      {room.beds.map(bed => {
                        const isSelected = selectedBedId === bed.id;
                        const isAvailable = bed.status === "available";
                        const isMyPending = bed.reserved_by === userId && bed.status === "pending";

                        let stroke = "#9ca3af";
                        let fill = "#f9fafb";
                        let pillow = "white";
                        let title = "Click to select";

                        if (isSelected) {
                          stroke = "#6B7FA3"; fill = "#F0F3F8"; pillow = "#D8E0ED";
                        } else if (bed.status === "pending") {
                          stroke = isMyPending ? "#6B7FA3" : "#E8734A";
                          fill = isMyPending ? "#F0F3F8" : "#FDF0EB";
                          pillow = isMyPending ? "#D8E0ED" : "#F9D5C4";
                          title = isMyPending ? "Your reservation" : "Pending";
                        } else if (bed.status === "occupied") {
                          stroke = "#6b7280"; fill = "#e5e7eb"; pillow = "#9ca3af";
                          title = "Occupied";
                        }

                        return (
                          <button
                            key={bed.id}
                            title={title}
                            disabled={!isAvailable && !isSelected}
                            onClick={() => {
                              if (!isAvailable) return;
                              setSelectedBedId(prev => prev === bed.id ? null : bed.id);
                            }}
                            className={`flex flex-col items-center gap-0.5 transition-all focus:outline-none ${
                              isAvailable ? "hover:scale-110 active:scale-95 cursor-pointer" : "cursor-not-allowed"
                            } ${isSelected ? "scale-110 drop-shadow-md" : ""}`}
                          >
                            <BedIcon
                              stroke={stroke}
                              fill={fill}
                              pillowFill={pillow}
                              label={isSelected ? "✓" : String(bed.bed_number)}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservation summary */}
      {selectedBedId && selectedBedInfo && (
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(96,165,250,0.06))", border: "1px solid rgba(96,165,250,0.27)" }}>
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa, #34d399)" }} />
          <h3 className="font-display font-semibold mb-4 mt-1" style={{ color: "#e8ecf4" }}>Reserve This Bed</h3>

          <div className="rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>Floor</div>
              <div className="font-medium" style={{ color: "#e8ecf4" }}>{selectedBedInfo.floor.floor_label}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>Room</div>
              <div className="font-medium" style={{ color: "#e8ecf4" }}>{selectedBedInfo.room.room_number}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>Bed</div>
              <div className="font-medium" style={{ color: "#e8ecf4" }}>Bed {selectedBedInfo.bed.bed_number}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>Type</div>
              <div className="font-medium" style={{ color: "#e8ecf4" }}>{SHARING_LABELS[selectedBedInfo.room.sharing_type]}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs" style={{ color: "rgba(241,243,249,0.38)" }}>Rent per month</div>
              <div className="font-semibold text-lg" style={{ color: "#34d399" }}>
                {formatCurrency(selectedBedInfo.room.rent_per_person)}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(241,243,249,0.38)" }}>
              Message to owner (optional)
            </label>
            <textarea
              value={tenantMessage}
              onChange={e => setTenantMessage(e.target.value)}
              rows={2}
              placeholder="Any questions or notes for the owner..."
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all resize-none border-white/[0.08] bg-white/[0.04] text-[#e8ecf4] placeholder:text-white/40 focus:border-[#60a5fa]/50"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>

          {isLoggedIn ? (
            <Magnetic strength={0.2} style={{ display: "block" }}>
              <button
                onClick={handleReserve}
                disabled={reserving}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-full"
                style={{ background: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)", color: "#0a0c18", border: "none", cursor: reserving ? "not-allowed" : "pointer", boxShadow: "0 0 32px rgba(96,165,250,0.27)", opacity: reserving ? 0.5 : 1 }}
              >
                {reserving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BedDouble className="w-4 h-4" />}
                Reserve This Bed
              </button>
            </Magnetic>
          ) : (
            <div className="rounded-xl p-5 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(120deg, rgba(167,139,250,0.15), rgba(96,165,250,0.1))", border: "1px solid rgba(96,165,250,0.25)" }}>
                <BedDouble className="w-5 h-5" style={{ color: "#60a5fa" }} />
              </div>
              <p className="font-display font-bold mb-1" style={{ color: "#e8ecf4" }}>
                Sign in to reserve this bed
              </p>
              <p className="text-xs mb-4" style={{ color: "rgba(241,243,249,0.38)" }}>
                Create a free account to book your spot — takes under a minute
              </p>
              <div className="flex gap-2">
                <button onClick={() => onAuthRequired("/login")} className="flex-1 py-2.5 text-sm font-semibold rounded-full" style={{ background: "linear-gradient(120deg, #a78bfa, #60a5fa)", color: "#0a0c18", border: "none", cursor: "pointer" }}>
                  Sign in
                </button>
                <button onClick={() => onAuthRequired("/signup")} className="flex-1 py-2.5 text-sm font-semibold rounded-full" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.62)", cursor: "pointer" }}>
                  Create account
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bed Icon SVG ────────────────────────────────────────────────────────────

function BedIcon({
  stroke,
  fill,
  pillowFill,
  label,
  size = 38,
}: {
  stroke: string;
  fill: string;
  pillowFill: string;
  label?: string;
  size?: number;
}) {
  // viewBox 0 0 40 52 — front-facing single bed
  const h = Math.round(size * 1.35);
  return (
    <svg viewBox="0 0 40 52" width={size} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Headboard */}
      <rect x="2" y="2" width="36" height="14" rx="5" fill={fill} stroke={stroke} strokeWidth="2.5" />
      {/* Pillow */}
      <rect x="7" y="5" width="26" height="8" rx="2.5" fill={pillowFill} stroke={stroke} strokeWidth="1.5" />
      {/* Mattress body */}
      <rect x="2" y="18" width="36" height="20" rx="2" fill={fill} stroke={stroke} strokeWidth="2.5" />
      {/* Left leg */}
      <rect x="5" y="40" width="8" height="9" rx="2" fill={fill} stroke={stroke} strokeWidth="2" />
      {/* Right leg */}
      <rect x="27" y="40" width="8" height="9" rx="2" fill={fill} stroke={stroke} strokeWidth="2" />
      {/* Label inside mattress */}
      {label && (
        <text
          x="20" y="30"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={stroke}
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

const inputCls = "w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all" +
  " border-white/[0.08] bg-white/[0.04] text-[#e8ecf4] placeholder:text-white/40" +
  " focus:border-[#60a5fa]/50 focus:ring-1 focus:ring-[#60a5fa]/30";
