"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS } from "@/lib/utils";
import {
  MapPin, Home, ArrowLeft, Phone, Users, BedDouble,
  Loader2, CheckCircle, Calendar, Clock, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import type { Listing } from "@/types";
import FallingFeathers, { spawnFeathers } from "@/components/FallingFeathers";

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

const D = {
  bg:       "#EEEEEE",
  card:     "rgba(255,255,255,0.72)",
  border:   "rgba(255,255,255,0.85)",
  borderDim:"rgba(0,0,0,0.08)",
  text:     "#0e1120",
  textDim:  "rgba(10,12,28,0.65)",
  textMute: "rgba(10,12,28,0.4)",
  teal:     "#0D9E8F",
  grad:     "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
};

const cardSt: React.CSSProperties = {
  background: D.card,
  backdropFilter: "blur(32px) saturate(180%)",
  WebkitBackdropFilter: "blur(32px) saturate(180%)",
  border: `1px solid ${D.border}`,
  borderRadius: 20,
  boxShadow: "0 4px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)",
  padding: 28,
};

const inputSt: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.6)",
  border: "1px solid rgba(0,0,0,0.09)",
  borderRadius: 12,
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
  color: D.text,
  boxSizing: "border-box",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
};

export default function ListingDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const isLoggedIn = !userLoading && profile !== null;
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingWithOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  // Bed state (lifted to top level for sidebar reactivity)
  const [sections, setSections] = useState<FloorSection[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [tenantMessage, setTenantMessage] = useState("");
  const [reserving, setReserving] = useState(false);

  // Visit state (inline form)
  const [visitName, setVisitName] = useState("");
  const [visitEmail, setVisitEmail] = useState("");
  const [visitPhone, setVisitPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitBooked, setVisitBooked] = useState(false);

  const [feathers, setFeathers] = useState<ReturnType<typeof spawnFeathers>>([]);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*, owner:profiles!listings_owner_id_fkey(full_name, phone)")
        .eq("id", listingId)
        .single();
      setListing(data);
      setLoading(false);
    };
    run();
  }, [listingId, supabase]);

  const fetchBeds = useCallback(async () => {
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
        floorMap.set(fid, { floor_id: fid, floor_label: room.floor.floor_label, floor_number: room.floor.floor_number, rooms: [] });
      }
      floorMap.get(fid)!.rooms.push({
        room_id: room.id, room_number: room.room_number, sharing_type_id: room.sharing_type_id, floor_id: fid,
        sharing_type: room.sharing_type.sharing_type, rent_per_person: room.sharing_type.rent_per_person,
        beds: (room.beds || []).map(b => ({ id: b.id, bed_number: b.bed_number, status: b.status as BedCell["status"], reserved_by: b.reserved_by })),
      });
    });
    setSections(Array.from(floorMap.values()).sort((a, b) => a.floor_number - b.floor_number));
  }, [supabase, listingId]);

  useEffect(() => { fetchBeds(); }, [fetchBeds]);

  useEffect(() => {
    if (profile) {
      setVisitName(profile.full_name || "");
      setVisitPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setVisitEmail(user.email);
    });
  }, [supabase]);

  const selectedBedInfo = useMemo(() => {
    for (const section of sections) {
      for (const room of section.rooms) {
        const bed = room.beds.find(b => b.id === selectedBedId);
        if (bed) return { bed, room, floor: section };
      }
    }
    return null;
  }, [sections, selectedBedId]);

  const redirectToAuth = (dest: "/login" | "/signup" = "/login") => {
    if (typeof window !== "undefined") localStorage.setItem("redirect_after_auth", window.location.href);
    router.push(dest);
  };

  const handleReserve = async () => {
    if (!profile?.id || !selectedBedId || !selectedBedInfo) return;
    setReserving(true);
    try {
      const { error } = await supabase.from("bed_reservations").insert({
        bed_id: selectedBedId, listing_id: listingId,
        floor_id: selectedBedInfo.floor.floor_id, sharing_type_id: selectedBedInfo.room.sharing_type_id,
        tenant_id: profile.id, status: "pending", tenant_message: tenantMessage.trim() || null,
      });
      if (error) { toast.error("Failed to reserve bed. Try again."); return; }
      await supabase.from("listing_beds").update({ status: "pending", reserved_by: profile.id, reserved_at: new Date().toISOString() }).eq("id", selectedBedId);
      toast.success("Bed reserved! The owner will confirm shortly.");
      const f = spawnFeathers(18);
      setFeathers(f);
      setTimeout(() => setFeathers([]), 5000);
      setSections(prev => prev.map(s => ({ ...s, rooms: s.rooms.map(r => ({ ...r, beds: r.beds.map(b => b.id === selectedBedId ? { ...b, status: "pending" as const, reserved_by: profile.id } : b) })) })));
      setSelectedBedId(null);
      setTenantMessage("");
    } finally { setReserving(false); }
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing!.id, listing_title: listing!.title, listing_area: listing!.area,
          full_name: visitName, email: visitEmail, phone: visitPhone,
          visit_date: visitDate, visit_time: visitTime,
          user_id: profile?.id || null, owner_phone: listing!.owner?.phone || null, owner_name: listing!.owner?.full_name || null,
        }),
      });
      if (!res.ok) { toast.error("Failed to schedule visit. Try again."); return; }
      setVisitBooked(true);
      const f = spawnFeathers(16);
      setFeathers(f);
      setTimeout(() => setFeathers([]), 5000);
    } catch { toast.error("Failed to schedule visit. Try again."); }
    finally { setVisitLoading(false); }
  };

  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: D.teal }} />
    </div>
  );

  if (!listing) return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <p style={{ color: D.textDim, marginBottom: 12 }}>Listing not found.</p>
      <Link href="/tenant/search" style={{ color: D.teal, fontSize: 13 }}>← Back to search</Link>
    </div>
  );

  const photos = listing.photos || [];
  const owner = listing.owner;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 80px" }}>
      <FallingFeathers feathers={feathers} />

      {/* Back link */}
      <Link href="/tenant/search" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: D.textMute, textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to search
      </Link>

      {/* ── Photo Carousel ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ position: "relative", height: 420, borderRadius: 20, overflow: "hidden", background: "rgba(107,127,163,0.2)" }}>
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[activePhoto]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Home style={{ width: 56, height: 56, color: D.textMute }} />
            </div>
          )}
          {photos.length > 1 && (
            <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, backdropFilter: "blur(8px)" }}>
              {activePhoto + 1} / {photos.length}
            </div>
          )}
          {photos.length > 1 && (<>
            <button onClick={() => setActivePhoto(p => (p - 1 + photos.length) % photos.length)} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <ChevronLeft style={{ width: 18, height: 18, color: D.text }} />
            </button>
            <button onClick={() => setActivePhoto(p => (p + 1) % photos.length)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <ChevronRight style={{ width: 18, height: 18, color: D.text }} />
            </button>
          </>)}
        </div>
        {photos.length > 1 && (
          <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 4 }}>
            {photos.map((photo, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} style={{ flexShrink: 0, width: 80, height: 56, borderRadius: 10, overflow: "hidden", border: `2.5px solid ${activePhoto === i ? D.teal : "transparent"}`, padding: 0, cursor: "pointer", background: "none", transition: "border-color 0.15s" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Title card */}
          <div style={{ ...cardSt }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.teal, background: "rgba(13,158,143,0.1)", border: "1px solid rgba(13,158,143,0.25)", borderRadius: 99, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {listing.room_type}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: D.textDim, background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 99, padding: "3px 10px", textTransform: "capitalize" }}>
                {listing.furnishing}
              </span>
              {listing.gender_preference !== "any" && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#7c6af4", background: "rgba(124,106,244,0.08)", border: "1px solid rgba(124,106,244,0.2)", borderRadius: 99, padding: "3px 10px" }}>
                  {listing.gender_preference === "male" ? "👨 Male only" : "👩 Female only"}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", marginBottom: 8, fontFamily: "var(--font-display)" }}>
              {listing.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: D.textDim, marginBottom: 16 }}>
              <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
              {listing.address || listing.area}, Mumbai — {listing.pincode}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: D.textDim }}>
                <Home style={{ width: 14, height: 14, color: D.textMute }} />
                <span style={{ textTransform: "capitalize" }}>{listing.room_type} room</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: D.textDim }}>
                <Users style={{ width: 14, height: 14, color: D.textMute }} />
                {listing.rooms_available} beds available
              </span>
            </div>
          </div>

          {/* About */}
          <div style={{ ...cardSt }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 12, fontFamily: "var(--font-display)" }}>About this PG</h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: D.textDim }}>{listing.description}</p>
          </div>

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <div style={{ ...cardSt }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 16, fontFamily: "var(--font-display)" }}>Amenities</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {listing.amenities.map((a) => (
                  <div key={a} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: D.textDim, background: "rgba(13,158,143,0.05)", border: "1px solid rgba(13,158,143,0.1)", borderRadius: 10, padding: "8px 12px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.teal, flexShrink: 0 }} />
                    {AMENITY_LABELS[a] || a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bed Picker */}
          {sections.length > 0 && (
            <div style={{ ...cardSt }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <BedDouble style={{ width: 20, height: 20, color: D.teal }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, fontFamily: "var(--font-display)" }}>Choose Your Bed</h2>
              </div>
              <p style={{ fontSize: 13, color: D.textMute, marginBottom: 20 }}>Select your preferred space. Details appear on the right.</p>

              {/* Legend */}
              <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Available", stroke: "#9ca3af", fill: "#f9fafb", pillow: "white" },
                  { label: "Selected",  stroke: D.teal,    fill: "rgba(13,158,143,0.1)", pillow: "rgba(13,158,143,0.2)" },
                  { label: "Pending",   stroke: "#E8734A", fill: "#FDF0EB", pillow: "#F9D5C4" },
                  { label: "Occupied",  stroke: "#6b7280", fill: "#e5e7eb", pillow: "#9ca3af" },
                ].map(({ label, stroke, fill, pillow }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: D.textMute }}>
                    <BedIcon stroke={stroke} fill={fill} pillowFill={pillow} size={18} />
                    {label}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {sections.map(section => (
                  <div key={section.floor_id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                        {section.floor_label}
                      </span>
                      <div style={{ flex: 1, height: 1, background: D.borderDim }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {section.rooms.map(room => (
                        <div key={room.room_id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 90, flexShrink: 0, textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: D.text }}>{room.room_number}</div>
                            <div style={{ fontSize: 10, color: D.textMute, lineHeight: 1.3 }}>{SHARING_LABELS[room.sharing_type]}</div>
                          </div>
                          <div style={{ width: 1, height: 48, background: D.borderDim, flexShrink: 0 }} />
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {room.beds.map(bed => {
                              const isSelected = selectedBedId === bed.id;
                              const isAvailable = bed.status === "available";
                              const isMyPending = bed.reserved_by === profile?.id && bed.status === "pending";
                              let stroke = "#9ca3af", fill = "#f9fafb", pillow = "white";
                              if (isSelected) { stroke = D.teal; fill = "rgba(13,158,143,0.1)"; pillow = "rgba(13,158,143,0.2)"; }
                              else if (bed.status === "pending") { stroke = isMyPending ? D.teal : "#E8734A"; fill = isMyPending ? "rgba(13,158,143,0.08)" : "#FDF0EB"; pillow = isMyPending ? "rgba(13,158,143,0.15)" : "#F9D5C4"; }
                              else if (bed.status === "occupied") { stroke = "#6b7280"; fill = "#e5e7eb"; pillow = "#9ca3af"; }
                              return (
                                <button key={bed.id} disabled={!isAvailable && !isSelected}
                                  onClick={() => { if (!isAvailable) return; setSelectedBedId(prev => prev === bed.id ? null : bed.id); }}
                                  style={{ background: "none", border: "none", padding: 0, cursor: isAvailable ? "pointer" : "not-allowed", transform: isSelected ? "scale(1.12)" : "scale(1)", transition: "transform 0.15s", filter: isSelected ? `drop-shadow(0 4px 8px rgba(13,158,143,0.3))` : "none" }}
                                >
                                  <BedIcon stroke={stroke} fill={fill} pillowFill={pillow} label={isSelected ? "✓" : String(bed.bed_number)} />
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
          )}

          {/* House Rules */}
          {listing.rules.length > 0 && (
            <div style={{ ...cardSt }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 16, fontFamily: "var(--font-display)" }}>House Rules</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {listing.rules.map((rule, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: D.textDim }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(13,158,143,0.1)", border: "1px solid rgba(13,158,143,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.teal, display: "block" }} />
                    </span>
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (sticky) ── */}
        <div style={{ position: "sticky", top: 100, display: "flex", flexDirection: "column", gap: 16 }}>

          {selectedBedInfo ? (
            /* ── Selection card ── */
            <div style={{ ...cardSt, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: D.teal, textTransform: "uppercase", letterSpacing: "0.2em" }}>Your Selection</div>
                <button onClick={() => { setSelectedBedId(null); setTenantMessage(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMute, padding: 4, display: "flex", alignItems: "center" }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              {[
                { label: "Floor",    value: selectedBedInfo.floor.floor_label },
                { label: "Room / Bed", value: `${selectedBedInfo.room.room_number} / Bed ${selectedBedInfo.bed.bed_number}` },
                { label: "Type",     value: SHARING_LABELS[selectedBedInfo.room.sharing_type] },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${D.borderDim}` }}>
                  <span style={{ fontSize: 12, color: D.textMute }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 18, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: D.textMute, marginBottom: 4 }}>Monthly Rent</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: D.teal, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  {formatCurrency(selectedBedInfo.room.rent_per_person)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: D.textMute }}> / person</span>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Message to Owner</div>
                <textarea value={tenantMessage} onChange={e => setTenantMessage(e.target.value)} rows={3}
                  placeholder="Briefly introduce yourself..."
                  style={{ ...inputSt, resize: "none", fontSize: 13 }} />
              </div>
              {isLoggedIn ? (
                <button onClick={handleReserve} disabled={reserving}
                  style={{ width: "100%", padding: "14px", borderRadius: 99, background: D.grad, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: reserving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 32px rgba(13,158,143,0.25)", opacity: reserving ? 0.7 : 1 }}>
                  {reserving ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <><BedDouble style={{ width: 16, height: 16 }} /> Reserve This Bed</>}
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => redirectToAuth("/login")} style={{ width: "100%", padding: "12px", borderRadius: 99, background: D.teal, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Sign in to reserve
                  </button>
                  <button onClick={() => redirectToAuth("/signup")} style={{ width: "100%", padding: "12px", borderRadius: 99, background: "transparent", border: `1px solid ${D.borderDim}`, color: D.textDim, fontSize: 13, cursor: "pointer" }}>
                    Create account
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Default price card ── */
            <div style={{ ...cardSt, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: D.text, letterSpacing: "-0.03em" }}>{formatCurrency(listing.monthly_rent)}</div>
                <div style={{ fontSize: 12, color: D.textMute }}>per month · all inclusive</div>
              </div>
              {[
                { label: "Security deposit", value: formatCurrency(listing.security_deposit), highlight: false },
                { label: "Beds available",   value: String(listing.rooms_available),           highlight: false },
                { label: "Platform fee",     value: "₹0",                                      highlight: true  },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: `1px solid ${D.borderDim}` }}>
                  <span style={{ fontSize: 13, color: D.textDim }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: highlight ? D.teal : D.text }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                {isLoggedIn ? (
                  <button
                    onClick={() => { const el = document.getElementById("visit-section"); el?.scrollIntoView({ behavior: "smooth" }); }}
                    style={{ width: "100%", padding: "14px", borderRadius: 99, background: D.teal, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 24px rgba(13,158,143,0.25)" }}>
                    <Calendar style={{ width: 16, height: 16 }} /> Schedule a Visit
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 13, color: D.textDim, textAlign: "center", marginBottom: 4 }}>Sign in to schedule a visit</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => redirectToAuth("/login")} style={{ flex: 1, padding: "11px", borderRadius: 99, background: D.teal, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>Sign in</button>
                      <button onClick={() => redirectToAuth("/signup")} style={{ flex: 1, padding: "11px", borderRadius: 99, background: "transparent", border: `1px solid ${D.borderDim}`, color: D.textDim, fontSize: 13, cursor: "pointer" }}>Sign up</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Owner card */}
          {owner && (
            <div style={{ ...cardSt, padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Listed by</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(13,158,143,0.1)", border: "1px solid rgba(13,158,143,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: D.teal, flexShrink: 0 }}>
                  {owner.full_name?.charAt(0) || "?"}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{owner.full_name}</div>
                  {owner.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: D.textMute, marginTop: 2 }}>
                      <Phone style={{ width: 11, height: 11 }} /> {owner.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Visit Section (inline) ── */}
      <div id="visit-section" style={{ marginTop: 32, ...cardSt }}>
        {visitBooked ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,158,143,0.1)", border: "1px solid rgba(13,158,143,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle style={{ width: 32, height: 32, color: D.teal }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: D.text, fontFamily: "var(--font-display)", marginBottom: 8 }}>You&apos;re all set!</h3>
            <p style={{ fontSize: 14, color: D.textDim, marginBottom: 20 }}>
              Your visit to <strong style={{ color: D.text }}>{listing.title}</strong> is confirmed.
            </p>
            <div style={{ background: "rgba(13,158,143,0.06)", border: "1px solid rgba(13,158,143,0.15)", borderRadius: 14, padding: "16px 28px", display: "inline-block", textAlign: "left", marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: D.textDim, lineHeight: 2 }}>
                <div>📅 {new Date(visitDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                <div>🕐 {visitTime}</div>
                <div>📍 {listing.area}, Mumbai</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: D.textMute }}>Confirmation sent to <strong>{visitEmail}</strong></p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            {/* Left: title + inputs */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Calendar style={{ width: 20, height: 20, color: D.teal }} />
                <h2 style={{ fontSize: 20, fontWeight: 800, color: D.text, fontFamily: "var(--font-display)" }}>Schedule a Visit</h2>
              </div>
              <p style={{ fontSize: 13, color: D.textDim, marginBottom: 24, lineHeight: 1.6 }}>
                Book a private tour of this PG. We&apos;ll confirm your slot within 2 hours.
              </p>
              {isLoggedIn ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Full Name</div>
                      <input type="text" value={visitName} onChange={e => setVisitName(e.target.value)} placeholder="Your name" style={inputSt} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Phone</div>
                      <input type="tel" value={visitPhone} onChange={e => setVisitPhone(e.target.value)} placeholder="98765 43210" style={inputSt} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Email Address</div>
                    <input type="email" value={visitEmail} onChange={e => setVisitEmail(e.target.value)} placeholder="you@example.com" style={inputSt} />
                  </div>
                </div>
              ) : (
                <div style={{ background: "rgba(13,158,143,0.05)", border: "1px solid rgba(13,158,143,0.15)", borderRadius: 14, padding: 20, textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: D.textDim, marginBottom: 16 }}>Sign in to schedule a visit</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => redirectToAuth("/login")} style={{ flex: 1, padding: "11px", borderRadius: 99, background: D.teal, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>Sign in</button>
                    <button onClick={() => redirectToAuth("/signup")} style={{ flex: 1, padding: "11px", borderRadius: 99, background: "transparent", border: `1px solid ${D.borderDim}`, color: D.textDim, fontSize: 13, cursor: "pointer" }}>Create account</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: date + time */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Select Date &amp; Preferred Time</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {nextDays.map(day => {
                  const dateStr = day.toISOString().split("T")[0];
                  const isSelected = visitDate === dateStr;
                  return (
                    <button key={dateStr} onClick={() => { setVisitDate(dateStr); setVisitTime(""); }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 14px", borderRadius: 12, border: `1.5px solid ${isSelected ? D.teal : D.borderDim}`, background: isSelected ? D.teal : "rgba(255,255,255,0.6)", color: isSelected ? "#fff" : D.text, cursor: "pointer", minWidth: 56, transition: "all 0.15s", boxSizing: "border-box" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: isSelected ? 1 : 0.45, letterSpacing: "0.05em" }}>
                        {day.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{day.getDate()}</span>
                    </button>
                  );
                })}
              </div>
              {visitDate ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {TIME_SLOTS.map(slot => {
                    const isSelected = visitTime === slot;
                    return (
                      <button key={slot} onClick={() => setVisitTime(slot)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "9px 6px", borderRadius: 10, border: `1.5px solid ${isSelected ? D.teal : D.borderDim}`, background: isSelected ? D.teal : "rgba(255,255,255,0.6)", color: isSelected ? "#fff" : D.textDim, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
                        <Clock style={{ width: 11, height: 11 }} />{slot}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: D.textMute, fontStyle: "italic" }}>Select a date to see available slots</p>
              )}
              {isLoggedIn && (
                <button onClick={submitVisit} disabled={visitLoading || !visitDate || !visitTime}
                  style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 99, background: D.teal, color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: visitLoading || !visitDate || !visitTime ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 24px rgba(13,158,143,0.25)", opacity: visitLoading || !visitDate || !visitTime ? 0.6 : 1, transition: "opacity 0.15s" }}>
                  {visitLoading ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <><Calendar style={{ width: 16, height: 16 }} /> Confirm Visit</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BedIcon({ stroke, fill, pillowFill, label, size = 38 }: { stroke: string; fill: string; pillowFill: string; label?: string; size?: number }) {
  const h = Math.round(size * 1.35);
  return (
    <svg viewBox="0 0 40 52" width={size} height={h} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="14" rx="5" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="7" y="5" width="26" height="8" rx="2.5" fill={pillowFill} stroke={stroke} strokeWidth="1.5" />
      <rect x="2" y="18" width="36" height="20" rx="2" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="5" y="40" width="8" height="9" rx="2" fill={fill} stroke={stroke} strokeWidth="2" />
      <rect x="27" y="40" width="8" height="9" rx="2" fill={fill} stroke={stroke} strokeWidth="2" />
      {label && (
        <text x="20" y="30" textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize="11" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">
          {label}
        </text>
      )}
    </svg>
  );
}
