"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, AMENITY_LABELS, AREAS_MUMBAI } from "@/lib/utils";
import {
  Search, MapPin, X, SlidersHorizontal,
} from "lucide-react";
import type { Listing } from "@/types";
import Link from "next/link";
import PigeonLoader from "@/components/shared/PigeonLoader";

export default function TenantSearchPage() {
  const supabase = useMemo(() => createClient(), []);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [area, setArea] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [gender, setGender] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [roomType, setRoomType] = useState("");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (area) query = query.ilike("area", `%${area}%`);
      if (minRent) query = query.gte("monthly_rent", Number(minRent));
      if (maxRent) query = query.lte("monthly_rent", Number(maxRent));
      if (gender) query = query.in("gender_preference", [gender, "any"]);
      if (furnishing) query = query.eq("furnishing", furnishing);
      if (roomType) query = query.eq("room_type", roomType);

      const { data } = await query;
      setListings(data || []);
    } finally {
      setLoading(false);
    }
  }, [supabase, area, minRent, maxRent, gender, furnishing, roomType]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const clearFilters = () => {
    setArea("");
    setMinRent("");
    setMaxRent("");
    setGender("");
    setFurnishing("");
    setRoomType("");
  };

  const activeFilterCount = [area, minRent, maxRent, gender, furnishing, roomType]
    .filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#2C3040]">
          Find PGs in Mumbai
        </h1>
        <p className="text-sm text-[#7A7A8A] mt-0.5">
          {loading ? "Searching…" : `${listings.length} listing${listings.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-3 bg-[#FDFBF8] border border-[#E2DDD6] rounded-xl px-4 py-3 shadow-sm focus-within:border-[#E8734A] focus-within:ring-2 focus-within:ring-[#E8734A]/15 transition-all">
          <MapPin className="w-4 h-4 text-[#A09488] flex-shrink-0" />
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Search by area — Andheri, Bandra, Powai..."
            className="flex-1 text-sm bg-transparent outline-none text-[#2C3040] placeholder:text-[#A09488]"
          />
          {area && (
            <button onClick={() => setArea("")} className="text-[#A09488] hover:text-[#5C5450]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? "bg-[#FDF0EB] border-[#E8734A] text-[#C5522E]"
              : "bg-[#FDFBF8] border-[#E2DDD6] text-[#5C5450] hover:border-[#B8C4D8]"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[#E8734A] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="feather-card p-5 mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#2C3040] text-sm">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#E8734A] hover:text-[#C5522E] font-medium transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Area</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className={selectCls}>
                <option value="">All areas</option>
                {AREAS_MUMBAI.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Min rent (₹)</label>
              <input
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
                placeholder="e.g. 5000"
                className={selectCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Max rent (₹)</label>
              <input
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                placeholder="e.g. 20000"
                className={selectCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectCls}>
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Furnishing</label>
              <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={selectCls}>
                <option value="">Any</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Room type</label>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className={selectCls}>
                <option value="">Any</option>
                <option value="single">Single</option>
                <option value="double">Double sharing</option>
                <option value="triple">Triple sharing</option>
                <option value="dormitory">Dormitory</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <PigeonLoader size="md" />
          <p className="text-sm text-[#A09488]">Finding your perfect nest…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && listings.length === 0 && (
        <div className="feather-card text-center py-20 px-8">
          <Search className="w-10 h-10 text-[#C4BAB0] mx-auto mb-4" />
          <h3 className="font-display font-bold text-[#2C3040] mb-1">
            No listings found
          </h3>
          <p className="text-sm text-[#7A7A8A] mb-4">
            Try adjusting your filters or searching a different area
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="feather-btn mx-auto text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Listings grid */}
      {!loading && listings.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 stagger">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/tenant/listing/${listing.id}`}
              className="pg-card feather-card overflow-hidden group block"
            >
              {/* Photo */}
              <div className="h-48 bg-gradient-to-br from-[#F5C4B0] to-[#F0A882] relative overflow-hidden">
                {listing.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-[#C5522E] opacity-40" />
                  </div>
                )}
                {listing.gender_preference !== "any" && (
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-[#2C3040]">
                    {listing.gender_preference === "male" ? "👨 Male only" : "👩 Female only"}
                  </span>
                )}
                <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-[#2C3040] capitalize">
                  {listing.room_type}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display font-bold text-[#2C3040] mb-1 line-clamp-1">
                  {listing.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-[#A09488] mb-3">
                  <MapPin className="w-3 h-3" />
                  {listing.area}, Mumbai
                </div>

                {listing.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {listing.amenities.slice(0, 4).map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-[#EDE8E0] text-[#5C5450] px-2 py-0.5 rounded-md"
                      >
                        {AMENITY_LABELS[a] || a}
                      </span>
                    ))}
                    {listing.amenities.length > 4 && (
                      <span className="text-xs text-[#A09488]">
                        +{listing.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#E2DDD6]">
                  <div>
                    <span className="font-display text-lg font-bold text-[#E8734A]">
                      {formatCurrency(listing.monthly_rent)}
                    </span>
                    <span className="text-xs text-[#7A7A8A]">/month</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#7A7A8A]">
                      {listing.rooms_available} room{listing.rooms_available !== 1 ? "s" : ""} left
                    </div>
                    <div className="text-xs text-[#A09488] capitalize">
                      {listing.furnishing}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const selectCls = "w-full border border-[#E2DDD6] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/15 transition-all bg-[#FDFBF8] text-[#2C3040]";
