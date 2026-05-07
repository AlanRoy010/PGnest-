"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS, AREAS_MUMBAI } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import type { Listing } from "@/types";
import Link from "next/link";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { TiltCard } from "@/components/FeatherFX";

const D = {
  card:     "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  border:   "rgba(255,255,255,0.08)",
  text:     "#e8ecf4",
  textDim:  "rgba(241,243,249,0.62)",
  textMute: "rgba(241,243,249,0.38)",
  iris:     "#60a5fa",
  gradient: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
  input:    "rgba(255,255,255,0.04)",
};

const PHOTO_GRADIENTS = [
  "linear-gradient(135deg, hsla(250,80%,40%,0.7), hsla(250,80%,25%,0.4)), #171a2e",
  "linear-gradient(135deg, hsla(320,70%,40%,0.7), hsla(320,70%,25%,0.4)), #171a2e",
  "linear-gradient(135deg, hsla(170,60%,40%,0.7), hsla(170,60%,25%,0.4)), #171a2e",
  "linear-gradient(135deg, hsla(30,60%,40%,0.7),  hsla(30,60%,25%,0.4)),  #171a2e",
  "linear-gradient(135deg, hsla(290,65%,40%,0.7), hsla(290,65%,25%,0.4)), #171a2e",
  "linear-gradient(135deg, hsla(200,70%,40%,0.7), hsla(200,70%,25%,0.4)), #171a2e",
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [area, setArea] = useState(searchParams.get("area") || "");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState(searchParams.get("max_rent") || "");
  const [gender, setGender] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [roomType, setRoomType] = useState(searchParams.get("room_type") || "");

  const [debouncedArea, setDebouncedArea] = useState(area);
  const [debouncedMinRent, setDebouncedMinRent] = useState(minRent);
  const [debouncedMaxRent, setDebouncedMaxRent] = useState(maxRent);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedArea(area);
      setDebouncedMinRent(minRent);
      setDebouncedMaxRent(maxRent);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [area, minRent, maxRent]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 15000)
    );
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (debouncedArea)    query = query.ilike("area", `%${debouncedArea}%`);
      if (debouncedMinRent) query = query.gte("monthly_rent", Number(debouncedMinRent));
      if (debouncedMaxRent) query = query.lte("monthly_rent", Number(debouncedMaxRent));
      if (gender)           query = query.in("gender_preference", [gender, "any"]);
      if (furnishing)       query = query.eq("furnishing", furnishing);
      if (roomType)         query = query.eq("room_type", roomType);

      const { data, error } = await Promise.race([query, timeout]);
      if (error) { setFetchError(true); }
      setListings(data || []);
    } catch {
      setFetchError(true);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, debouncedArea, debouncedMinRent, debouncedMaxRent, gender, furnishing, roomType]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const clearFilters = () => {
    setArea(""); setMinRent(""); setMaxRent("");
    setGender(""); setFurnishing(""); setRoomType("");
  };

  const activeFilterCount = [area, minRent, maxRent, gender, furnishing, roomType].filter(Boolean).length;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Browse roosts</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {loading ? (
            "Finding nests…"
          ) : (
            <>
              <span style={{ background: D.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{listings.length}</span>
              {" "}place{listings.length !== 1 ? "s" : ""} to roost in Mumbai
            </>
          )}
        </h1>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: D.input, border: `1px solid ${D.border}`, borderRadius: 14, padding: "12px 16px" }}>
          <MapPin style={{ width: 16, height: 16, color: D.textMute, flexShrink: 0 }} />
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Search by area — Andheri, Bandra, Powai…"
            style={{ flex: 1, fontSize: 14, background: "transparent", border: "none", outline: "none", color: D.text }}
          />
          {area && (
            <button onClick={() => setArea("")} style={{ background: "none", border: "none", cursor: "pointer", color: D.textMute }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 18px", borderRadius: 14, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: showFilters || activeFilterCount > 0
              ? "linear-gradient(120deg, rgba(167,139,250,0.15), rgba(96,165,250,0.08))"
              : D.input,
            border: showFilters || activeFilterCount > 0
              ? "1px solid rgba(96,165,250,0.27)"
              : `1px solid ${D.border}`,
            color: showFilters || activeFilterCount > 0 ? D.iris : D.textDim,
          }}
        >
          <SlidersHorizontal style={{ width: 15, height: 15 }} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ background: D.gradient, color: "#0a0c18", fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Area chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {["All Mumbai", "Andheri West", "Bandra", "Powai", "Malad", "Goregaon", "Dadar"].map((chip) => {
          const isAll = chip === "All Mumbai";
          const isActive = isAll ? !area : area.toLowerCase() === chip.toLowerCase();
          return (
            <button
              key={chip}
              onClick={() => setArea(isAll ? "" : chip)}
              style={{
                padding: "8px 20px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                border: isActive ? "1px solid rgba(96,165,250,0.5)" : `1px solid ${D.border}`,
                background: isActive ? "linear-gradient(120deg, rgba(167,139,250,0.2), rgba(96,165,250,0.15))" : "transparent",
                color: isActive ? D.text : D.textDim,
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: D.text }}>Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ fontSize: 12, color: D.iris, background: "none", border: "none", cursor: "pointer" }}>Clear all</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Area", type: "select", value: area, onChange: setArea, options: [{ v: "", l: "All areas" }, ...AREAS_MUMBAI.map(a => ({ v: a, l: a }))] },
              { label: "Min rent (₹)", type: "number", value: minRent, onChange: setMinRent, placeholder: "e.g. 5000" },
              { label: "Max rent (₹)", type: "number", value: maxRent, onChange: setMaxRent, placeholder: "e.g. 20000" },
              { label: "Gender", type: "select", value: gender, onChange: setGender, options: [{ v: "", l: "Any" }, { v: "male", l: "Male" }, { v: "female", l: "Female" }] },
              { label: "Furnishing", type: "select", value: furnishing, onChange: setFurnishing, options: [{ v: "", l: "Any" }, { v: "furnished", l: "Furnished" }, { v: "semi-furnished", l: "Semi-furnished" }, { v: "unfurnished", l: "Unfurnished" }] },
              { label: "Room type", type: "select", value: roomType, onChange: setRoomType, options: [{ v: "", l: "Any" }, { v: "single", l: "Single" }, { v: "double", l: "Double" }, { v: "triple", l: "Triple" }, { v: "dormitory", l: "Dormitory" }] },
            ].map(({ label, type, value, onChange, options, placeholder }: {
              label: string; type: string; value: string;
              onChange: (v: string) => void;
              options?: { v: string; l: string }[];
              placeholder?: string;
            }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>{label}</div>
                {type === "select" && options ? (
                  <select value={value} onChange={(e) => onChange(e.target.value)} style={inputSt}>
                    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputSt} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, gap: 16 }}>
          <PigeonLoader size="md" />
          <p style={{ fontSize: 14, color: D.textMute }}>Finding your perfect nest…</p>
        </div>
      )}

      {/* Error */}
      {!loading && fetchError && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
          <AlertCircle style={{ width: 40, height: 40, color: "#f472b6", margin: "0 auto 16px" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 8 }}>Couldn&apos;t load listings</h3>
          <p style={{ fontSize: 14, color: D.textDim, marginBottom: 20 }}>Your database may be waking up — this can take ~30 seconds on the free tier.</p>
          <button onClick={fetchListings} style={{ padding: "11px 28px", borderRadius: 99, background: D.gradient, color: "#0a0c18", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !fetchError && listings.length === 0 && (
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: "64px 32px", textAlign: "center" }}>
          <Search style={{ width: 40, height: 40, color: D.textMute, margin: "0 auto 16px" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 8 }}>No listings found</h3>
          <p style={{ fontSize: 14, color: D.textDim, marginBottom: 20 }}>Try adjusting your filters or searching a different area</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} style={{ padding: "11px 28px", borderRadius: 99, background: D.gradient, color: "#0a0c18", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && !fetchError && listings.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {listings.map((listing, idx) => (
            <TiltCard key={listing.id}>
              <Link href={`/tenant/listing/${listing.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", transition: "border-color 0.2s", cursor: "pointer" }}>
                  {/* Photo */}
                  <div style={{ height: 160, background: listing.photos[0] ? undefined : PHOTO_GRADIENTS[idx % PHOTO_GRADIENTS.length], position: "relative", overflow: "hidden" }}>
                    {listing.photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.photos[0]} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin style={{ width: 28, height: 28, color: "rgba(255,255,255,0.3)" }} />
                      </div>
                    )}
                    <span style={{ position: "absolute", top: 12, left: 12, padding: "5px 10px", borderRadius: 99, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(96,165,250,0.4)", color: D.iris, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      ● Verified
                    </span>
                    <span style={{ position: "absolute", top: 12, right: 12, padding: "5px 10px", borderRadius: 99, background: "rgba(0,0,0,0.5)", border: `1px solid ${D.border}`, color: D.textDim, fontSize: 9, textTransform: "capitalize" }}>
                      {listing.room_type}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{listing.area}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: D.text, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.title}</div>

                    {listing.amenities.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {listing.amenities.slice(0, 3).map((a) => (
                          <span key={a} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: D.iris }}>
                            {AMENITY_LABELS[a] || a}
                          </span>
                        ))}
                        {listing.amenities.length > 3 && (
                          <span style={{ fontSize: 10, color: D.textMute }}>+{listing.amenities.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
                      <div>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: D.text }}>{formatCurrency(listing.monthly_rent)}</span>
                        <span style={{ fontSize: 11, color: D.textMute }}>/mo</span>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: D.text, fontSize: 14 }}>→</div>
                    </div>
                  </div>
                </div>
              </Link>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TenantSearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 240, gap: 16 }}>
          <PigeonLoader size="md" />
          <p style={{ fontSize: 14, color: "rgba(241,243,249,0.38)" }}>Finding your perfect nest…</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none", color: "#e8ecf4",
};
