"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/utils";
import { Plus, Loader2, MapPin, ChevronRight } from "lucide-react";
import type { Listing } from "@/types";

type PortfolioFilter = "all" | "active" | "vacant";

function RevenueChart() {
  return (
    <svg viewBox="0 0 240 60" className="w-full" style={{ height: 60 }}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9E8F" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0D9E8F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,45 C20,40 30,50 50,35 C70,20 90,42 110,28 C130,14 150,38 170,22 C190,8 210,30 240,18 L240,60 L0,60 Z"
        fill="url(#revGrad)"
      />
      <path
        d="M0,45 C20,40 30,50 50,35 C70,20 90,42 110,28 C130,14 150,38 170,22 C190,8 210,30 240,18"
        fill="none"
        stroke="#0D9E8F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OccupancyRing({ pct }: { pct: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative" style={{ width: 104, height: 104 }}>
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="52" cy="52" r={r} fill="none" stroke="#E2DDD6" strokeWidth="10" />
        <circle
          cx="52" cy="52" r={r} fill="none"
          stroke="#0D9E8F" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "#0D9E8F", lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: 9, color: "#A09488", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>
          Active
        </span>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: userLoading } = useUser();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PortfolioFilter>("all");

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }, [supabase, profile]);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const activeListings = listings.filter((l) => l.is_active);

  const totalRevenue = activeListings.reduce((s, l) => s + l.monthly_rent, 0);
  const totalRooms = listings.reduce((s, l) => s + l.total_rooms, 0);
  const availableRooms = listings.reduce((s, l) => s + l.rooms_available, 0);
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const filteredListings = filter === "all"
    ? listings
    : filter === "active"
    ? listings.filter((l) => l.is_active && l.rooms_available < l.total_rooms)
    : listings.filter((l) => !l.is_active || l.rooms_available > 0);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#0D9E8F]" />
      </div>
    );
  }

  const D = {
    teal: "#0D9E8F",
    text: "#0e1120",
    textDim: "rgba(14,17,32,0.55)",
    border: "#E2DDD6",
    card: "#FDFBF8",
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: D.textDim, marginBottom: 8 }}>
            Owner Dashboard
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 900, color: D.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
            Welcome back, <em style={{ fontStyle: "italic", fontWeight: 400, color: D.teal }}>{firstName}</em>.
          </h1>
        </div>
        <Link href="/owner/listings" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 99,
          background: D.teal, color: "#fff",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          boxShadow: "0 4px 20px rgba(13,158,143,0.25)",
          flexShrink: 0, marginTop: 8,
        }}>
          <Plus style={{ width: 15, height: 15 }} /> Add New Property
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 32 }}>

        {/* Revenue Growth */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "24px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.textDim, marginBottom: 4 }}>
                Revenue Growth
              </p>
              <p style={{ fontSize: 12, color: D.textDim }}>Monthly earnings from all listings</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, color: D.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {formatCurrency(totalRevenue)}
              </p>
              <p style={{ fontSize: 11, color: D.teal, marginTop: 4, fontWeight: 600 }}>
                {activeListings.length} active listing{activeListings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Occupancy */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "24px 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.textDim, marginBottom: 4 }}>
              Occupancy
            </p>
            <p style={{ fontSize: 12, color: D.textDim }}>Live portfolio status</p>
          </div>
          <OccupancyRing pct={occupancyPct} />
          <p style={{ fontSize: 12, color: D.textDim }}>
            {occupiedRooms} of {totalRooms} rooms occupied
          </p>
        </div>
      </div>

      {/* ── Active Portfolio ── */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, overflow: "hidden" }}>
        {/* Portfolio header + tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: `1px solid ${D.border}` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
            Active Portfolio
          </h2>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "active", "vacant"] as PortfolioFilter[]).map((f) => {
              const label = f === "all"
                ? `All Properties (${listings.length})`
                : f === "active"
                ? `Occupied (${listings.filter((l) => l.is_active && l.rooms_available < l.total_rooms).length})`
                : `Vacant (${listings.filter((l) => !l.is_active || l.rooms_available > 0).length})`;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: filter === f ? 600 : 400,
                    border: `1px solid ${filter === f ? D.teal : D.border}`,
                    background: filter === f ? `rgba(13,158,143,0.08)` : "transparent",
                    color: filter === f ? D.teal : D.textDim,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listing rows */}
        {filteredListings.length === 0 ? (
          <div style={{ padding: "48px 28px", textAlign: "center", color: D.textDim, fontSize: 14 }}>
            No listings found.
          </div>
        ) : (
          filteredListings.map((listing, i) => {
            const isOccupied = listing.is_active && listing.rooms_available < listing.total_rooms;
            const occupiedRoomsCount = listing.total_rooms - listing.rooms_available;
            return (
              <Link
                key={listing.id}
                href="/owner/listings"
                style={{
                  display: "flex", alignItems: "center", gap: 20,
                  padding: "20px 28px",
                  borderBottom: i < filteredListings.length - 1 ? `1px solid ${D.border}` : "none",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(13,158,143,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Photo */}
                <div style={{ width: 90, height: 68, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #fed7aa, #fdba74)" }}>
                  {listing.photos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: D.textDim }}>
                      <MapPin style={{ width: 11, height: 11 }} /> {listing.area}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {listing.title}
                  </p>
                  <div style={{ display: "flex", gap: 24 }}>
                    <Stat label={isOccupied ? "Occupied" : "Available"} value={isOccupied ? `${occupiedRoomsCount}/${listing.total_rooms}` : `${listing.rooms_available}/${listing.total_rooms}`} />
                    <Stat label="Rent" value={formatCurrency(listing.monthly_rent)} />
                    <Stat label="Furnishing" value={listing.furnishing} />
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  flexShrink: 0,
                  padding: "4px 12px", borderRadius: 99,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  background: isOccupied ? "rgba(13,158,143,0.12)" : "rgba(14,17,32,0.06)",
                  color: isOccupied ? D.teal : D.textDim,
                }}>
                  {isOccupied ? "Occupied" : "Vacant"}
                </span>

                <ChevronRight style={{ width: 16, height: 16, color: D.textDim, flexShrink: 0 }} />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(14,17,32,0.4)", marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1120" }}>{value}</p>
    </div>
  );
}
