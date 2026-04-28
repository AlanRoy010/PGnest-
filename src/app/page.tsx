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
    gradient: "from-[#6B7FA3] to-[#4A5A7A]",
  },
  {
    id: 2,
    name: "Bandra Elite Stay",
    area: "Bandra",
    rent: 18000,
    type: "Single",
    verified: true,
    gradient: "from-[#4A5A7A] to-[#364466]",
  },
  {
    id: 3,
    name: "Powai Lake View PG",
    area: "Powai",
    rent: 15000,
    type: "Triple",
    verified: true,
    gradient: "from-[#7C6E9E] to-[#6B7FA3]",
  },
  {
    id: 4,
    name: "Thane Comfort House",
    area: "Thane West",
    rent: 9000,
    type: "Double",
    verified: false,
    gradient: "from-[#403C38] to-[#5C5450]",
  },
  {
    id: 5,
    name: "Malad Student Hub",
    area: "Malad",
    rent: 8000,
    type: "Dormitory",
    verified: true,
    gradient: "from-[#E8734A] to-[#C5522E]",
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

// Decorative floating feather positions for hero
const HERO_FEATHERS = [
  { top: "12%", left: "8%",  size: 18, color: "#F5C4B0", delay: "0s",    dur: "7s" },
  { top: "25%", right: "6%", size: 14, color: "#B8C4D8", delay: "1.2s",  dur: "6s" },
  { top: "55%", left: "15%", size: 22, color: "#7C6E9E", delay: "0.5s",  dur: "8s" },
  { top: "40%", right: "12%",size: 12, color: "#E8734A", delay: "2s",    dur: "5.5s" },
  { top: "70%", left: "6%",  size: 16, color: "#6B7FA3", delay: "0.8s",  dur: "7.5s" },
  { top: "18%", left: "50%", size: 10, color: "#F5C4B0", delay: "1.6s",  dur: "6.5s" },
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
    <div className="min-h-screen bg-[#F7F4EF] font-body overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PGOwns" width={44} height={44} className="brightness-0 invert" />
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
            <Link href="/signup" className="feather-btn text-sm">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative h-[82vh] min-h-[580px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80"
          alt="Modern apartment interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Wing blue-grey gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2C3040]/82 to-[#4A5A7A]/65" />

        {/* Large pigeon watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0.04 }}
        >
          <svg width="500" height="500" viewBox="0 0 64 64" fill="white">
            <ellipse cx="32" cy="38" rx="18" ry="14" />
            <ellipse cx="28" cy="40" rx="12" ry="8" opacity="0.6" />
            <circle cx="40" cy="22" r="11" />
            <ellipse cx="36" cy="30" rx="5" ry="4" opacity="0.5" />
            <path d="M50 22 L56 21 L50 24 Z" />
            <path d="M14 42 L8 50 L16 46 L12 54 L20 48 Z" opacity="0.8" />
          </svg>
        </div>

        {/* Floating feather decorations */}
        {HERO_FEATHERS.map((f, i) => (
          <div
            key={i}
            className="feather-drift absolute pointer-events-none"
            style={{
              top: f.top,
              left: "left" in f ? f.left : undefined,
              right: "right" in f ? f.right : undefined,
              animationDelay: f.delay,
              animationDuration: f.dur,
            }}
          >
            <svg width={f.size} height={f.size * 3} viewBox="0 0 20 60" fill={f.color}>
              <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" opacity="0.8" />
              <path d="M10,8 C12,14 13,22 12,32 C11,40 10,50 10,50" fill="none" stroke={f.color} strokeWidth="0.8" opacity="0.5" />
            </svg>
          </div>
        ))}

        {/* Hero text — bottom left */}
        <div className="absolute bottom-24 left-6 md:left-16 max-w-lg">
          <p className="text-[#E8734A] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Mumbai&apos;s #1 PG Platform
          </p>
          <h1 className="font-display text-5xl md:text-[3.75rem] font-black text-white leading-[1.0] mb-5">
            Find your<br /><em className="italic text-[#F9D5C4]">perfect nest</em><br />in Mumbai
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
        <div className="bg-[#FDFBF8] rounded-2xl shadow-2xl border border-[#E2DDD6] flex flex-col md:flex-row items-stretch overflow-hidden">

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#E2DDD6]">
            <span className="text-[9px] font-bold text-[#A09488] uppercase tracking-widest mb-1">
              City / Area
            </span>
            <select
              value={searchArea}
              onChange={(e) => setSearchArea(e.target.value)}
              className="text-sm font-semibold text-[#2C3040] bg-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="">Any area in Mumbai</option>
              {AREAS.filter((a) => a !== "All").map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#E2DDD6]">
            <span className="text-[9px] font-bold text-[#A09488] uppercase tracking-widest mb-1">
              Type of Sharing
            </span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="text-sm font-semibold text-[#2C3040] bg-transparent outline-none appearance-none cursor-pointer"
            >
              <option value="">Any type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="dormitory">Dormitory</option>
            </select>
          </div>

          <div className="flex-1 flex flex-col justify-center px-5 py-4 border-b md:border-b-0 md:border-r border-[#E2DDD6]">
            <span className="text-[9px] font-bold text-[#A09488] uppercase tracking-widest mb-1">
              Max Rent
            </span>
            <select
              value={searchPrice}
              onChange={(e) => setSearchPrice(e.target.value)}
              className="text-sm font-semibold text-[#2C3040] bg-transparent outline-none appearance-none cursor-pointer"
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
            className="flex items-center justify-center gap-2 bg-[#E8734A] text-white px-8 py-5 font-bold text-sm hover:bg-[#C5522E] transition-colors flex-shrink-0"
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
                  ? "bg-[#E8734A] text-white shadow-md"
                  : "bg-[#EDE8E0] text-[#5C5450] hover:bg-[#DDD6CA]"
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
          <h2 className="font-display text-2xl font-black text-[#2C3040]">
            Featured nests
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCard(prevIdx)}
              className="w-9 h-9 rounded-full border border-[#E2DDD6] flex items-center justify-center hover:bg-[#EDE8E0] hover:border-[#E8734A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#5C5450]" />
            </button>
            <button
              onClick={() => setActiveCard(nextIdx)}
              className="w-9 h-9 rounded-full border border-[#E2DDD6] flex items-center justify-center hover:bg-[#EDE8E0] hover:border-[#E8734A] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#5C5450]" />
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
                  ? "w-6 h-2.5 bg-[#E8734A]"
                  : "w-2.5 h-2.5 bg-[#C4BAB0] hover:bg-[#A09488]"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── CATEGORIES GRID ───────────────────────────────── */}
      <section className="bg-[#F0F3F8] py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <h2 className="font-display text-4xl md:text-5xl font-black text-[#2C3040] text-center mb-2">
            Categories &amp; Information
          </h2>
          <p className="text-[#7A7A8A] text-center mb-12 text-sm">
            Everything you need to find and manage your perfect PG
          </p>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="pg-card flex items-center gap-3 bg-[#FDFBF8] rounded-2xl p-4 border border-[#E2DDD6] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-11 h-11 bg-[#6B7FA3] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#4A5A7A] transition-colors">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-[#2C3040] leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY PGOWNS ────────────────────────────────────── */}
      <section className="py-20 bg-[#F7F4EF]">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <h2 className="font-display text-4xl font-black text-[#2C3040] text-center mb-2">
            Why choose <em className="italic text-[#E8734A]">PG Owns</em>?
          </h2>
          <p className="text-[#7A7A8A] text-center mb-12 text-sm">
            Built specifically for Mumbai PG seekers
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Transparent Deposit",
                desc: "See your exact deposit balance at all times. Every deduction requires a reason. Dispute unfair claims directly.",
                color: "#6B7FA3",
              },
              {
                icon: IndianRupee,
                title: "Secure Payments",
                desc: "Pay rent and deposit through Razorpay. Your money is held safely and only released at contract end.",
                color: "#E8734A",
              },
              {
                icon: Star,
                title: "Verified Listings",
                desc: "Every PG goes through verification. Photos are real, amenities accurate, and rules clearly stated.",
                color: "#7C6E9E",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="feather-card pg-card p-7 group hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: f.color + "18" }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-display font-bold text-[#2C3040] text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[#7A7A8A] leading-relaxed mb-4">{f.desc}</p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8734A] hover:gap-2.5 transition-all"
                >
                  Read More <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ─────────────────────────────────────── */}
      <section className="bg-[#4A5A7A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        {/* Feather drift decorations */}
        <div className="feather-drift absolute top-8 right-20 pointer-events-none" style={{ animationDelay: "0.5s" }}>
          <svg width="20" height="60" viewBox="0 0 20 60" fill="#F5C4B0" opacity="0.2">
            <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" />
          </svg>
        </div>
        <div className="feather-drift absolute bottom-4 left-10 pointer-events-none" style={{ animationDelay: "1.5s", animationDuration: "8s" }}>
          <svg width="14" height="42" viewBox="0 0 20 60" fill="#B8C4D8" opacity="0.2">
            <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" />
          </svg>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[#F9D5C4] text-xs font-bold uppercase tracking-[0.2em] mb-3">For PG Owners</p>
            <h2 className="font-display text-4xl font-black text-white mb-3">
              Own a PG? List it for free.
            </h2>
            <p className="text-white/55 max-w-md leading-relaxed text-sm">
              Reach thousands of verified tenants. Manage bookings, collect payments, and handle deposits — all from one dashboard.
            </p>
          </div>
          <Link href="/signup?role=owner" className="feather-btn flex-shrink-0 text-sm font-black">
            List your PG <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#364466]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PGOwns" width={36} height={36} className="brightness-0 invert" />
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
      className={`pg-card bg-[#FDFBF8] rounded-3xl overflow-hidden relative ${
        featured ? "shadow-2xl ring-2 ring-[#E8734A]/10" : "shadow-md"
      }`}
    >
      {/* Tricolor top bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E8734A] via-[#6B7FA3] to-[#7C6E9E] z-10" />

      {/* Gradient image placeholder */}
      <div className={`h-44 bg-gradient-to-br ${listing.gradient} relative`}>
        {listing.verified && (
          <span className="absolute top-3 left-3 bg-[#E8734A] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
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
        <h3 className="font-display font-bold text-[#2C3040] text-base mb-1 leading-tight">
          {listing.name}
        </h3>
        <div className="flex items-center gap-1 text-[#A09488] text-xs mb-4">
          <MapPin className="w-3 h-3" /> {listing.area}, Mumbai
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-xl text-[#E8734A]">
              ₹{listing.rent.toLocaleString("en-IN")}
            </span>
            <span className="text-[#A09488] text-xs">/mo</span>
          </div>
          <Link
            href={`/tenant/search?area=${encodeURIComponent(listing.area)}`}
            className="bg-[#E8734A] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#C5522E] transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
