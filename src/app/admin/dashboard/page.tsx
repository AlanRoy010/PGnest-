"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { formatCurrency } from "@/lib/utils";
import { MapPin, ChevronRight, Loader2 } from "lucide-react";
import type { Listing } from "@/types";

type PortfolioFilter = "all" | "occupied" | "vacant";

function RevenueChart() {
  return (
    <svg viewBox="0 0 300 64" style={{ width: "100%", height: 64 }}>
      <defs>
        <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9E8F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0D9E8F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,48 C25,42 38,54 60,38 C82,22 105,46 128,30 C151,14 170,40 196,24 C222,8 248,34 300,16 L300,64 L0,64 Z"
        fill="url(#adminRevGrad)"
      />
      <path
        d="M0,48 C25,42 38,54 60,38 C82,22 105,46 128,30 C151,14 170,40 196,24 C222,8 248,34 300,16"
        fill="none"
        stroke="#0D9E8F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OccupancyRing({ pct }: { pct: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: 112, height: 112 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="#E2DDD6" strokeWidth="11" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke="#0D9E8F" strokeWidth="11"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#0D9E8F", lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: 9, color: "#A09488", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginTop: 3 }}>
          Active
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading: userLoading } = useUser();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PortfolioFilter>("all");

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const firstName = profile?.full_name?.split(" ")[0] || "Admin";

  const activeListings = listings.filter((l) => l.is_active);
  const totalRevenue = activeListings.reduce((s, l) => s + l.monthly_rent, 0);
  const totalRooms = listings.reduce((s, l) => s + l.total_rooms, 0);
  const availableRooms = listings.reduce((s, l) => s + l.rooms_available, 0);
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const occupiedList = listings.filter((l) => l.is_active && l.rooms_available < l.total_rooms);
  const vacantList = listings.filter((l) => !l.is_active || l.rooms_available >= l.total_rooms);
  const filteredListings =
    filter === "all" ? listings : filter === "occupied" ? occupiedList : vacantList;

  if (userLoading || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
        <Loader2 style={{ width: 24, height: 24, color: "#0D9E8F", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const D = {
    teal: "#0D9E8F",
    text: "#0e1120",
    dim: "rgba(14,17,32,0.52)",
    border: "#E2DDD6",
    card: "#FDFBF8",
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 28px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: 10 }}>
            Admin Dashboard
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, color: D.text, letterSpacing: "-0.03em", lineHeight: 1, margin: 0 }}>
            Welcome back, <em style={{ fontStyle: "italic", fontWeight: 400, color: D.teal }}>{firstName}</em>.
          </h1>
        </div>
        <Link
          href="/admin/listings"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 99,
            background: D.teal, color: "#fff",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(13,158,143,0.28)",
            flexShrink: 0, marginTop: 10,
          }}
        >
          + View All Listings
        </Link>
      </div>

      {/* ── Stat cards row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 28 }}>

        {/* Revenue Growth */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "26px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.dim, marginBottom: 5 }}>
                Revenue Growth
              </p>
              <p style={{ fontSize: 12, color: D.dim, margin: 0 }}>Monthly earnings from all listings</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color: D.text, letterSpacing: "-0.02em", lineHeight: 1, margin: 0 }}>
                {formatCurrency(totalRevenue)}
              </p>
              <p style={{ fontSize: 11, color: D.teal, marginTop: 5, fontWeight: 600 }}>
                {activeListings.length} active listing{activeListings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <RevenueChart />
        </div>

        {/* Occupancy */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "26px 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: D.dim, marginBottom: 5 }}>
              Occupancy
            </p>
            <p style={{ fontSize: 12, color: D.dim, margin: 0 }}>Live portfolio status</p>
          </div>
          <OccupancyRing pct={occupancyPct} />
          <p style={{ fontSize: 12, color: D.dim, margin: 0 }}>
            {occupiedRooms} of {totalRooms} rooms occupied
          </p>
        </div>
      </div>

      {/* ── Active Portfolio ── */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, overflow: "hidden" }}>

        {/* Header + filter tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: `1px solid ${D.border}` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: D.text, letterSpacing: "-0.02em", margin: 0 }}>
            Active Portfolio
          </h2>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "all",      label: `All Properties (${listings.length})` },
              { key: "occupied", label: `Occupied (${occupiedList.length})` },
              { key: "vacant",   label: `Vacant (${vacantList.length})` },
            ] as { key: PortfolioFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: 12,
                  fontWeight: filter === key ? 600 : 400,
                  border: `1px solid ${filter === key ? D.teal : D.border}`,
                  background: filter === key ? "rgba(13,158,143,0.08)" : "transparent",
                  color: filter === key ? D.teal : D.dim,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        {filteredListings.length === 0 ? (
          <div style={{ padding: "48px 28px", textAlign: "center", color: D.dim, fontSize: 14 }}>
            No listings found.
          </div>
        ) : (
          filteredListings.map((listing, i) => {
            const isOccupied = listing.is_active && listing.rooms_available < listing.total_rooms;
            return (
              <Link
                key={listing.id}
                href="/admin/listings"
                style={{
                  display: "flex", alignItems: "center", gap: 20,
                  padding: "20px 28px",
                  borderBottom: i < filteredListings.length - 1 ? `1px solid ${D.border}` : "none",
                  textDecoration: "none",
                  background: "transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(13,158,143,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Photo */}
                <div style={{
                  width: 96, height: 72, borderRadius: 12, overflow: "hidden",
                  flexShrink: 0, background: "linear-gradient(135deg,#fed7aa,#fdba74)",
                }}>
                  {listing.photos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: D.dim, marginBottom: 4 }}>
                    <MapPin style={{ width: 11, height: 11 }} /> {listing.area}
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {listing.title}
                  </p>
                  <div style={{ display: "flex", gap: 28 }}>
                    <StatCell label={isOccupied ? "Rooms Occupied" : "Available"} value={`${listing.total_rooms - listing.rooms_available}/${listing.total_rooms}`} />
                    <StatCell label="Rent" value={formatCurrency(listing.monthly_rent)} />
                    <StatCell label="Type" value={listing.furnishing} />
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  flexShrink: 0, padding: "5px 14px", borderRadius: 99,
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                  background: isOccupied ? "rgba(13,158,143,0.12)" : "rgba(14,17,32,0.06)",
                  color: isOccupied ? D.teal : D.dim,
                }}>
                  {isOccupied ? "Occupied" : "Vacant"}
                </span>

                <ChevronRight style={{ width: 16, height: 16, color: D.dim, flexShrink: 0 }} />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(14,17,32,0.38)", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#0e1120", margin: 0 }}>{value}</p>
    </div>
  );
}
