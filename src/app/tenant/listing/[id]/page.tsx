"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS } from "@/lib/utils";
import {
  MapPin, Users, Home, ArrowLeft, Phone,
  Loader2, CheckCircle, Calendar, X, Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import type { Listing } from "@/types";

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

export default function ListingDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const { profile } = useUser();

  const [listing, setListing] = useState<Listing | null>(null);
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
  }, [params.id]);

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
  }, [profile]);

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
        owner_phone: (listing!.owner as any)?.phone || null,
        owner_name: (listing!.owner as any)?.full_name || null,
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

  const owner = listing.owner as any;

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

            {/* Schedule visit button */}
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
              // ── Success state ──
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
              // ── Form state ──
              <div className="p-5 space-y-4">
                {/* Listing info pill */}
                <div className="bg-[#fff7ed] rounded-xl p-3">
                  <p className="text-xs font-medium text-[#c2410c]">{listing.title}</p>
                  <p className="text-xs text-[#78716c]">{listing.area}, Mumbai</p>
                </div>

                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                      Full name *
                    </label>
                    <input
                      type="text"
                      value={visitName}
                      onChange={(e) => setVisitName(e.target.value)}
                      placeholder="Your name"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={visitPhone}
                      onChange={(e) => setVisitPhone(e.target.value)}
                      placeholder="98765 43210"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={visitEmail}
                    onChange={(e) => setVisitEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>

                {/* Date picker */}
                <div>
                  <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                    Select date *
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    min={minDateStr}
                    onChange={(e) => {
                      setVisitDate(e.target.value);
                      setVisitTime("");
                    }}
                    className={inputCls}
                  />
                </div>

                {/* Time slots — only show after date is picked */}
                {visitDate && (
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-2">
                      Select time *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setVisitTime(slot)}
                          className={`flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            visitTime === slot
                              ? "bg-[#fff7ed] border-[#ea6c0a] text-[#c2410c]"
                              : "border-[#e7e5e4] text-[#57534e] hover:border-[#a8a29e]"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeVisitModal}
                    className="flex-1 py-2.5 text-sm font-medium text-[#57534e] border border-[#e7e5e4] rounded-xl hover:bg-[#f5f5f4] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitVisit}
                    disabled={visitLoading || !visitDate || !visitTime}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50"
                  >
                    {visitLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <><Calendar className="w-4 h-4" /> Confirm visit</>
                    )}
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

const inputCls = "w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]";