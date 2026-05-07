"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, Wifi, Wind, Dumbbell, Utensils, Car, Shield, AlertCircle } from "lucide-react";
import type { Listing } from "@/types";
import Link from "next/link";
import PigeonLoader from "@/components/shared/PigeonLoader";

const C = {
  teal:     "#0D9E8F",
  tealDark: "#0A8578",
  text:     "#1C1C2E",
  textDim:  "rgba(28,28,46,0.65)",
  textMute: "rgba(28,28,46,0.4)",
  border:   "rgba(0,0,0,0.08)",
  card:     "#FFFFFF",
  tag:      "#F2F2F2",
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, ac: Wind, gym: Dumbbell, meals: Utensils, parking: Car, security: Shield,
};

const PG_TYPES = [
  { value: "single",    label: "Single Room" },
  { value: "double",    label: "Double Sharing" },
  { value: "triple",    label: "Triple Sharing" },
  { value: "dormitory", label: "Dormitory" },
];

const AMENITY_TOGGLES = [
  { key: "wifi",     label: "High-Speed WiFi",  icon: Wifi },
  { key: "ac",       label: "Air Conditioning", icon: Wind },
  { key: "gym",      label: "Fitness Center",   icon: Dumbbell },
  { key: "meals",    label: "Meals Included",   icon: Utensils },
  { key: "parking",  label: "Parking",          icon: Car },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
        background: on ? C.teal : "rgba(0,0,0,0.15)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16,
        borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [searchText, setSearchText] = useState(searchParams.get("q") || searchParams.get("area") || "");
  const [maxRent, setMaxRent] = useState(50000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [enabledAmenities, setEnabledAmenities] = useState<string[]>([]);
  const [area, setArea] = useState(searchParams.get("area") || "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchText]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .lte("monthly_rent", maxRent)
        .order("created_at", { ascending: false });

      if (debouncedSearch) query = query.ilike("area", `%${debouncedSearch}%`);
      if (area) query = query.ilike("area", `%${area}%`);
      if (selectedTypes.length > 0) query = query.in("room_type", selectedTypes);

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      );
      const { data, error } = await Promise.race([query, timeout]);
      if (error) { setFetchError(true); }
      setListings(data || []);
    } catch {
      setFetchError(true);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, debouncedSearch, area, maxRent, selectedTypes]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const toggleType = (v: string) =>
    setSelectedTypes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleAmenity = (k: string) =>
    setEnabledAmenities(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const resetFilters = () => {
    setSearchText(""); setArea(""); setMaxRent(50000);
    setSelectedTypes([]); setEnabledAmenities([]);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 80px" }}>

      {/* ── Search bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "#fff", border: `1.5px solid ${C.border}`,
        borderRadius: 16, padding: "10px 16px", marginBottom: 36,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        <Search style={{ width: 18, height: 18, color: C.textMute, flexShrink: 0 }} />
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search by city, neighborhood, or landmark..."
          style={{ flex: 1, fontSize: 14, background: "transparent", border: "none", outline: "none", color: C.text }}
        />
        <button
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 99, background: "#F2F2F2", border: "none", color: C.textDim, fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0 }}
          onClick={() => {}}
        >
          <SlidersHorizontal style={{ width: 14, height: 14 }} /> Filters
        </button>
        <button
          onClick={fetchListings}
          style={{ padding: "9px 22px", borderRadius: 99, background: C.tealDark, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          Search Now
        </button>
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* ── Left filter panel ── */}
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Price Range */}
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>Price Range</h3>
            <input
              type="range" min={5000} max={50000} step={1000} value={maxRent}
              onChange={e => setMaxRent(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.teal, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.textMute, fontWeight: 500 }}>
              <span>₹5,000</span>
              <span style={{ color: C.teal, fontWeight: 700 }}>₹{maxRent.toLocaleString("en-IN")}{maxRent >= 50000 ? "+" : ""}</span>
            </div>
          </div>

          {/* PG Type */}
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 14 }}>PG Type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PG_TYPES.map(({ value, label }) => (
                <label key={value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: C.textDim, fontWeight: 500 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, border: selectedTypes.includes(value) ? `2px solid ${C.teal}` : "2px solid rgba(0,0,0,0.18)",
                    background: selectedTypes.includes(value) ? C.teal : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s",
                  }}
                    onClick={() => toggleType(value)}
                  >
                    {selectedTypes.includes(value) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 14 }}>Amenities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AMENITY_TOGGLES.map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.textDim, fontWeight: 500 }}>{label}</span>
                  <Toggle on={enabledAmenities.includes(key)} onChange={() => toggleAmenity(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={resetFilters}
            style={{ width: "100%", padding: "11px 0", borderRadius: 99, background: "#E8E8E8", border: "none", color: C.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Reset All Filters
          </button>
        </div>

        {/* ── Right card grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
              <PigeonLoader size="md" />
              <p style={{ fontSize: 14, color: C.textMute }}>Finding your perfect nest…</p>
            </div>
          )}

          {!loading && fetchError && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
              <AlertCircle style={{ width: 40, height: 40, color: C.teal, margin: "0 auto 16px" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>Couldn&apos;t load listings</h3>
              <p style={{ fontSize: 14, color: C.textDim, marginBottom: 20 }}>Your database may be waking up — try again in a moment.</p>
              <button onClick={fetchListings} style={{ padding: "11px 28px", borderRadius: 99, background: C.teal, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Try again
              </button>
            </div>
          )}

          {!loading && !fetchError && listings.length === 0 && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16, padding: "64px 32px", textAlign: "center" }}>
              <Search style={{ width: 40, height: 40, color: C.textMute, margin: "0 auto 16px" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>No listings found</h3>
              <p style={{ fontSize: 14, color: C.textDim, marginBottom: 20 }}>Try adjusting your filters or a different area</p>
              <button onClick={resetFilters} style={{ padding: "11px 28px", borderRadius: 99, background: C.teal, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                Reset filters
              </button>
            </div>
          )}

          {!loading && !fetchError && listings.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const topAmenities = listing.amenities.slice(0, 3);

  return (
    <div style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", transition: "box-shadow .2s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)")}
    >
      {/* Photo */}
      <div style={{ height: 200, position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #b2dfdb, #80cbc4)" }}>
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin style={{ width: 32, height: 32, color: "rgba(255,255,255,0.5)" }} />
          </div>
        )}
        {/* Price badge */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          background: C.teal, color: "#fff",
          padding: "6px 14px", borderRadius: 99,
          fontSize: 13, fontWeight: 700,
          boxShadow: "0 4px 12px rgba(13,158,143,0.4)",
        }}>
          {formatCurrency(listing.monthly_rent)}/mo
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px 20px" }}>
        {/* Tags */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99, border: `1px solid ${C.border}`, color: C.textDim, background: C.tag }}>
            {listing.room_type}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99, border: `1px solid ${C.border}`, color: C.textDim, background: C.tag }}>
            {listing.area}
          </span>
        </div>

        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.2 }}>
          {listing.title}
        </h3>

        <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {listing.description || `${listing.furnishing} PG in ${listing.area}. ${listing.gender_preference !== "any" ? listing.gender_preference + " only. " : ""}${listing.amenities.length} amenities included.`}
        </p>

        {/* Amenity icons */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {topAmenities.map(a => {
              const Icon = AMENITY_ICONS[a];
              return Icon ? (
                <Icon key={a} style={{ width: 18, height: 18, color: C.textMute }} title={AMENITY_LABELS[a] || a} />
              ) : null;
            })}
          </div>
          <Link href={`/tenant/listing/${listing.id}`} style={{
            padding: "9px 22px", borderRadius: 99,
            background: C.teal, color: "#fff",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            transition: "background .2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = C.tealDark)}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TenantSearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
          <PigeonLoader size="md" />
          <p style={{ fontSize: 14, color: "rgba(28,28,46,0.4)" }}>Finding your perfect nest…</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
