"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Shield, IndianRupee, Star, ArrowRight, MapPin,
  ChevronLeft, ChevronRight, Users, Home,
  Phone, Globe, Info, Wrench, FileText,
} from "lucide-react";

// ── Data ────────────────────────────────────────────────────

const AREAS = ["All", "Andheri West", "Bandra", "Powai", "Thane West", "Malad", "Goregaon", "Dadar", "Kurla"];

const LISTINGS = [
  {
    id: 1,
    name: "Andheri Premium PG",
    area: "Andheri West",
    rent: 12000,
    type: "Double",
    verified: true,
    gradient: "from-[#1a3d2b] to-[#2d6a4f]",
  },
  {
    id: 2,
    name: "Bandra Elite Stay",
    area: "Bandra",
    rent: 18000,
    type: "Single",
    verified: true,
    gradient: "from-[#0f2d1e] to-[#1a3d2b]",
  },
  {
    id: 3,
    name: "Powai Lake View PG",
    area: "Powai",
    rent: 15000,
    type: "Triple",
    verified: true,
    gradient: "from-[#163324] to-[#1a3d2b]",
  },
  {
    id: 4,
    name: "Thane Comfort House",
    area: "Thane West",
    rent: 9000,
    type: "Double",
    verified: false,
    gradient: "from-[#1f2937] to-[#374151]",
  },
  {
    id: 5,
    name: "Malad Student Hub",
    area: "Malad",
    rent: 8000,
    type: "Dormitory",
    verified: true,
    gradient: "from-[#1a3d2b] to-[#0f2d1e]",
  },
];

const CATEGORIES = [
  { icon: Home,        label: "Search PG" },
  { icon: Info,        label: "Verified Listings" },
  { icon: MapPin,      label: "Mumbai Locations" },
  { icon: Users,       label: "Tenant Support" },
  { icon: Wrench,      label: "Maintenance" },
  { icon: Phone,       label: "Customer Service" },
  { icon: IndianRupee, label: "Secure Deposit" },
  { icon: FileText,    label: "Booking Docs" },
  { icon: Globe,       label: "Owner Portal" },
];

// ── Component ────────────────────────────────────────────────

export default function HomePage() {
  const [activeArea, setActiveArea] = useState("All");
  const [activeCard, setActiveCard] = useState(1);
  const [searchArea, setSearchArea]   = useState("");
  const [searchType, setSearchType]   = useState("");
  const [searchPrice, setSearchPrice] = useState("");

  const prevIdx = (activeCard - 1 + LISTINGS.length) % LISTINGS.length;
  const nextIdx = (activeCard + 1) % LISTINGS.length;

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchArea)  params.set("area", searchArea);
    if (searchType)  params.set("room_type", searchType);
    if (searchPrice) params.set("max_rent", searchPrice);
    const qs = params.toString();
    return `/tenant/search${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PGOwns" width={72} height={72} className="brightness-0 invert -mr-2" />
            <span className="font-display text-xl font-black text-white tracking-tight">Owns</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: "Home",   href: "/" },
              { label: "Search", href: "/tenant/search" },
              { label: "About",  href: "/" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-white/75 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold bg-[#f59e0b] text-[#111827] px-5 py-2.5 rounded-full hover:bg-[#fbbf24] transition-colors shadow-lg"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative h-[82vh] min-h-[580px]">
        {/* High-quality room photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80"
          alt="Modern apartment interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark forest-green overlay */}
        <div className="absolute inset-0 bg-[#0a1f12]/70" />

        {/* Hero text — bottom left */}
        <div className="absolute bottom-24 left-6 md:left-16 max-w-lg">
          <p className="text-[#f59e0b] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Mumbai&apos;s #1 PG Platform
          </p>
          <h1 className="font-display text-5xl md:text-[3.75rem] font-black text-white leading-[1.0] mb-5">
            Find Your<br />Perfect PG<br />in Mumbai
          </h1>
          <Link
            href="/tenant/search"
            className="inline-flex items-center gap-2 text-white/80 text-sm font-semibold border-b border-white/40 pb-0.5 hover:text-white hover:border-white transition-all"
          >
            Browse all listings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── SEARCH BAR — floating over hero bottom ────────── */}
      <div className="relative z-10 -mt-10 px-4 md:px-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] flex flex-col md:flex-row items-stretch overflow-hidden">

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#e5e7eb]">
            <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
              City / Area
            </span>
            <select
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="text-sm font-semibold text-[#111827] bg-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="">Any area in Mumbai</option>
              {AREAS.filter((a) => a !== "All").map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#e5e7eb]">
            <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
              Type of Sharing
            </span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="text-sm font-semibold text-[#111827] bg-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="">Any type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#e5e7eb]">
            <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">
              Max Rent
            </span>
            <select
              value={searchPrice}
              onChange={(e) => setSearchPrice(e.target.value)}
              className="text-sm font-semibold text-[#111827] bg-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="">Any price</option>
              <option value="5000">Up to ₹5,000</option>
              <option value="10000">Up to ₹10,000</option>
              <option value="15000">Up to ₹15,000</option>
              <option value="20000">Up to ₹20,000</option>
            </select>
          </div>

          <Link
            href={buildSearchUrl()}
            className="flex items-center justify-center gap-2 bg-[#1a3d2b] text-white px-8 py-5 font-bold text-sm hover:bg-[#0f2d1e] transition-colors flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            Search
          </Link>
        </div>
      </div>

      {/* ── AREA FILTER TABS ──────────────────────────────── */}
      <section className="mt-10 px-4 md:px-10 max-w-7xl mx-auto">
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeArea === area
                  ? "bg-[#1a3d2b] text-white shadow-md"
                  : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      {/* ── PG CARDS CAROUSEL ─────────────────────────────── */}
      <section className="mt-8 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-10 mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-black text-[#111827]">
            Featured PGs
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCard(prevIdx)}
              className="w-9 h-9 rounded-full border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#374151]" />
            </button>
            <button
              onClick={() => setActiveCard(nextIdx)}
              className="w-9 h-9 rounded-full border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f3f4f6] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#374151]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-4">
          {/* Left peeking card */}
          <div
            className="hidden md:block w-60 flex-shrink-0 opacity-50 scale-90 origin-right transition-all duration-300 cursor-pointer"
            onClick={() => setActiveCard(prevIdx)}
          >
            <ListingCard listing={LISTINGS[prevIdx]} />
          </div>

          {/* Center / active card */}
          <div className="w-full max-w-[340px] flex-shrink-0 transition-all duration-300 drop-shadow-2xl">
            <ListingCard listing={LISTINGS[activeCard]} featured />
          </div>

          {/* Right peeking card */}
          <div
            className="hidden md:block w-60 flex-shrink-0 opacity-50 scale-90 origin-left transition-all duration-300 cursor-pointer"
            onClick={() => setActiveCard(nextIdx)}
          >
            <ListingCard listing={LISTINGS[nextIdx]} />
          </div>
        </div>

        {/* Dot pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {LISTINGS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveCard(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeCard
                  ? "w-6 h-2.5 bg-[#f59e0b]"
                  : "w-2.5 h-2.5 bg-[#d1d5db] hover:bg-[#9ca3af]"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── CATEGORIES GRID ───────────────────────────────── */}
      <section className="bg-[#f8faf8] py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <h2 className="font-display text-4xl md:text-5xl font-black text-[#111827] text-center mb-2">
            Categories &amp; Information
          </h2>
          <p className="text-[#6b7280] text-center mb-12 text-sm">
            Everything you need to find and manage your perfect PG
          </p>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="w-11 h-11 bg-[#1a3d2b] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0f2d1e] transition-colors">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-[#111827] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PGOWNS ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <h2 className="font-display text-4xl font-black text-[#111827] text-center mb-2">
            3 Reasons to Choose Us
          </h2>
          <p className="text-[#6b7280] text-center mb-12 text-sm">
            Built specifically for Mumbai PG seekers
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Transparent Deposit",
                desc: "See your exact deposit balance at all times. Every deduction requires a reason. Dispute unfair claims directly.",
              },
              {
                icon: IndianRupee,
                title: "Secure Payments",
                desc: "Pay rent and deposit through Razorpay. Your money is held safely and only released at contract end.",
              },
              {
                icon: Star,
                title: "Verified Listings",
                desc: "Every PG goes through verification. Photos are real, amenities accurate, and rules clearly stated.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="relative border border-[#e5e7eb] rounded-3xl p-7 group hover:border-[#1a3d2b] transition-colors"
              >
                {/* Corner notch decoration */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#1a3d2b] rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#1a3d2b] rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-12 h-12 bg-[#1a3d2b] rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-[#111827] text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-4">{f.desc}</p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3d2b] hover:gap-2.5 transition-all"
                >
                  Read More <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ─────────────────────────────────────── */}
      <section className="bg-[#1a3d2b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display text-4xl font-black text-white mb-3">
              Own a PG? List it for free.
            </h2>
            <p className="text-white/55 max-w-md leading-relaxed text-sm">
              Reach thousands of verified tenants. Manage bookings, collect payments, and handle deposits — all from one dashboard.
            </p>
          </div>
          <Link
            href="/signup?role=owner"
            className="flex items-center gap-2 bg-[#f59e0b] text-[#111827] px-8 py-4 rounded-full font-black text-sm hover:bg-[#fbbf24] transition-colors flex-shrink-0 shadow-xl"
          >
            List your PG <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#0a1f12]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PGOwns" width={60} height={60} className="brightness-0 invert -mr-2" />
            <span className="font-display text-lg font-black text-white tracking-tight">Owns</span>
          </Link>
          <p className="text-xs text-white/30">© 2024 PG Owns. Built for Mumbai.</p>
        </div>
      </footer>

    </div>
  );
}

// ── Listing Card ─────────────────────────────────────────────

function ListingCard({
  listing,
  featured = false,
}: {
  listing: (typeof LISTINGS)[0];
  featured?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden ${
        featured ? "shadow-2xl ring-2 ring-[#1a3d2b]/10" : "shadow-md"
      }`}
    >
      {/* Gradient image placeholder */}
      <div className={`h-44 bg-gradient-to-br ${listing.gradient} relative`}>
        {listing.verified && (
          <span className="absolute top-3 left-3 bg-[#f59e0b] text-[#111827] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            Verified
          </span>
        )}
        <span className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
          {listing.type}
        </span>
        {/* Decorative dots */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30" />
          ))}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display font-bold text-[#111827] text-base mb-1 leading-tight">
          {listing.name}
        </h3>
        <div className="flex items-center gap-1 text-[#9ca3af] text-xs mb-4">
          <MapPin className="w-3 h-3" /> {listing.area}, Mumbai
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-xl text-[#1a3d2b]">
              ₹{listing.rent.toLocaleString("en-IN")}
            </span>
            <span className="text-[#9ca3af] text-xs">/mo</span>
          </div>
          <Link
            href={`/tenant/search?area=${encodeURIComponent(listing.area)}`}
            className="bg-[#1a3d2b] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#0f2d1e] transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
