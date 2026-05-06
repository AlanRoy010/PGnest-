"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Magnetic, TiltCard, AmbientFeathers } from "@/components/FeatherFX";

// ── Tokens ────────────────────────────────────────────────────
const C = {
  bg0: "#0a0c18",
  bg1: "#0f1224",
  bg2: "#171a2e",
  glass: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.09)",
  borderH: "rgba(255,255,255,0.18)",
  text: "#f1f3f9",
  textDim: "rgba(241,243,249,0.62)",
  textMute: "rgba(241,243,249,0.38)",
  pearl: "#e8ecf4",
  iri1: "#a78bfa",
  iri2: "#60a5fa",
  iri3: "#34d399",
  iri4: "#f472b6",
};
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ── Data ──────────────────────────────────────────────────────
const LISTINGS = [
  { id: 1, title: "Andheri Premium Roost",  area: "Andheri West", rent: 12000, type: "Double",  verified: true,  rooms: 2, total: 3, hue: "250,80%" },
  { id: 2, title: "Bandra Pearl Loft",       area: "Bandra",       rent: 18000, type: "Single",  verified: true,  rooms: 1, total: 2, hue: "320,70%" },
  { id: 3, title: "Powai Lake Sanctuary",    area: "Powai",        rent: 15000, type: "Triple",  verified: true,  rooms: 3, total: 4, hue: "170,60%" },
  { id: 4, title: "Malad Student Nest",      area: "Malad",        rent: 8000,  type: "Dorm",    verified: false, rooms: 5, total: 8, hue: "30,60%"  },
  { id: 5, title: "Goregaon Glass House",    area: "Goregaon",     rent: 11000, type: "Double",  verified: true,  rooms: 1, total: 3, hue: "290,65%" },
  { id: 6, title: "Dadar Heritage Eyrie",    area: "Dadar",        rent: 13500, type: "Single",  verified: true,  rooms: 0, total: 2, hue: "200,70%" },
];

// ── Iridescent text ───────────────────────────────────────────
function IriText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: `linear-gradient(120deg, ${C.iri1} 0%, ${C.iri2} 35%, ${C.iri3} 70%, ${C.iri4} 100%)`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}>
      {children}
    </span>
  );
}

// ── Glass surface ─────────────────────────────────────────────
function Glass({ children, style = {}, ...rest }: React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
      backdropFilter: "blur(24px) saturate(140%)",
      WebkitBackdropFilter: "blur(24px) saturate(140%)",
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

// ── Feather SVG ───────────────────────────────────────────────
function FeatherDecor({ size = 60, color = "#fff", opacity = 0.12, rotate = 0 }: {
  size?: number; color?: string; opacity?: number; rotate?: number;
}) {
  return (
    <svg width={size} height={size * 3.3} viewBox="0 0 24 80"
      style={{ display: "block", opacity, transform: `rotate(${rotate}deg)` }}>
      <defs>
        <linearGradient id={`fd-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.25"/>
        </linearGradient>
      </defs>
      <path d="M12 2 C12 2,22 18,20 38 C18 58,13 75,12 78 C11 75,6 58,4 38 C2 18,12 2,12 2 Z"
        fill={`url(#fd-${color.replace("#", "")})`}/>
      <path d="M12 8 L12 76" stroke={color} strokeWidth="0.6" opacity="0.5" fill="none"/>
      {[15,22,30,40,50,60,68].map(y => (
        <g key={y} stroke={color} strokeWidth="0.35" opacity="0.4" fill="none">
          <path d={`M12 ${y} Q${12-y/8} ${y+2},${12-y/4} ${y+4}`}/>
          <path d={`M12 ${y} Q${12+y/8} ${y+2},${12+y/4} ${y+4}`}/>
        </g>
      ))}
    </svg>
  );
}

// ── Scroll-aware glass nav ────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? "14px 48px" : "24px 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.4s cubic-bezier(.2,.9,.3,1)",
      background: scrolled ? "rgba(10,12,24,0.75)" : "transparent",
      backdropFilter: scrolled ? "blur(24px) saturate(140%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px) saturate(140%)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Image src="/logo.svg" alt="PG Owns" width={36} height={36} className="brightness-0 invert" />
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17, color: C.pearl, letterSpacing: "-0.02em", lineHeight: 1 }}>
            PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
          </div>
          <div style={{ fontSize: 8, color: C.textMute, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 2 }}>Find your nest</div>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
        {[["Find", "/tenant/search"], ["Owners", "/owner/listings"], ["Tenants", "/tenant/search"]].map(([label, href]) => (
          <Link key={label} href={href} style={{
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
            color: C.textDim, textDecoration: "none", letterSpacing: "0.02em",
            transition: "color .2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = C.pearl)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
          >{label}</Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/login" style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.textDim, padding: "8px 14px", textDecoration: "none" }}>
          Sign in
        </Link>
        <Magnetic strength={0.25}>
          <Link href="/signup" style={{
            background: `linear-gradient(120deg, ${C.iri1}, ${C.iri2})`,
            color: C.bg0, fontSize: 13, fontWeight: 700, padding: "10px 22px",
            borderRadius: 99, textDecoration: "none", display: "inline-block",
            boxShadow: `0 8px 24px ${C.iri1}55`, letterSpacing: "0.01em",
          }}>
            Get started
          </Link>
        </Magnetic>
      </div>
    </nav>
  );
}

// ── Listing card ──────────────────────────────────────────────
function ListingCard({ listing, delay = 0 }: { listing: typeof LISTINGS[0]; delay?: number }) {
  const [hover, setHover] = useState(false);
  return (
    <TiltCard max={5} style={{ animationDelay: `${delay}s` }}>
      <Link href="/tenant/search" style={{ textDecoration: "none", display: "block" }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Glass style={{
          overflow: "hidden", padding: 0,
          transition: "all .5s cubic-bezier(.2,.9,.3,1)",
          boxShadow: hover
            ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${C.iri2}66, 0 0 50px ${C.iri2}18`
            : "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {/* Photo area */}
          <div style={{
            height: 200, position: "relative", overflow: "hidden",
            background: `linear-gradient(135deg, hsla(${listing.hue},40%,0.6), hsla(${listing.hue},25%,0.3)), ${C.bg2}`,
          }}>
            {/* Shimmer on hover */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(115deg, transparent 30%, ${C.iri1}1a 50%, transparent 70%)`,
              transform: hover ? "translateX(20%)" : "translateX(-110%)",
              transition: "transform 1.2s cubic-bezier(.2,.9,.3,1)",
            }}/>
            {/* Feather watermark */}
            <div style={{ position: "absolute", top: 16, right: 20,
              transform: hover ? "rotate(-12deg) translateY(-4px)" : "rotate(-22deg)",
              transition: "transform .5s", opacity: 0.45 }}>
              <FeatherDecor size={36} color="#fff" opacity={1}/>
            </div>
            {listing.verified && (
              <div style={{
                position: "absolute", top: 14, left: 14,
                padding: "5px 11px", borderRadius: 99,
                background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
                border: `1px solid ${C.iri2}66`, color: C.iri2,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.iri3, boxShadow: `0 0 8px ${C.iri3}` }}/>
                Verified
              </div>
            )}
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>{listing.type}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", fontSize: 11, color: C.pearl, fontWeight: 600 }}>
                <span style={{ color: C.iri3 }}>★</span> 4.7
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 22px 22px" }}>
            <div style={{ fontSize: 10, color: C.textMute, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{listing.area}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: C.pearl, letterSpacing: "-0.01em", marginBottom: 14, lineHeight: 1.2 }}>{listing.title}</h3>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: C.pearl, letterSpacing: "-0.02em" }}>
                  {fmt(listing.rent)}<span style={{ fontSize: 11, fontWeight: 400, color: C.textMute, fontFamily: "var(--font-body)" }}>/mo</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMute, marginTop: 2 }}>{listing.rooms} of {listing.total} rooms left</div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: hover ? `linear-gradient(120deg,${C.iri1},${C.iri2})` : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .35s", color: hover ? C.bg0 : C.pearl, fontSize: 14, fontWeight: 700,
              }}>→</div>
            </div>
          </div>
        </Glass>
      </Link>
    </TiltCard>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [searchArea, setSearchArea] = useState("Any area in Mumbai");
  const [searchType, setSearchType] = useState("Single, Double, Triple…");
  const [searchBudget, setSearchBudget] = useState("₹15,000");
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchArea && searchArea !== "Any area in Mumbai") params.set("area", searchArea);
    if (searchBudget && searchBudget !== "₹15,000") params.set("max_rent", searchBudget.replace(/[^\d]/g, ""));
    const qs = params.toString();
    return `/tenant/search${qs ? `?${qs}` : ""}`;
  };

  return (
    <div style={{ background: C.bg0, minHeight: "100vh", color: C.text, overflowX: "hidden" }}>
      <AmbientFeathers count={12} />
      <Nav scrolled={scrollY > 40} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "140px 48px 100px" }}>
        {/* Parallax glow blobs */}
        <div style={{ position: "absolute", top: "8%", left: "8%", width: 560, height: 560, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri1}20, transparent 70%)`, filter: "blur(60px)", transform: `translateY(${scrollY * 0.28}px)`, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: "25%", right: "4%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri3}1e, transparent 70%)`, filter: "blur(60px)", transform: `translateY(${scrollY * 0.45}px)`, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: "8%", left: "28%", width: 640, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri4}16, transparent 70%)`, filter: "blur(80px)", pointerEvents: "none" }}/>

        {/* Big feather decoration — right side */}
        <div style={{ position: "absolute", right: "4%", top: "18%", opacity: 0.22, pointerEvents: "none", transform: `translateY(${scrollY * 0.15}px)` }}>
          <FeatherDecor size={90} color={C.iri2} opacity={1} rotate={-10}/>
        </div>
        <div style={{ position: "absolute", right: "10%", bottom: "20%", opacity: 0.12, pointerEvents: "none" }}>
          <FeatherDecor size={55} color={C.iri1} opacity={1} rotate={20}/>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 5 }}>
          {/* Eyebrow */}
          <div style={{ fontSize: 10, color: C.iri2, letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 700, marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 30, height: 1, background: `linear-gradient(90deg,transparent,${C.iri2})` }}/>
            Mumbai&apos;s most loved PG platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(56px, 9vw, 120px)",
            fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.04em",
            color: C.pearl, marginBottom: 32, maxWidth: 1000,
          }}>
            Every pigeon<br/>
            knows where<br/>
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>
              <IriText>home</IriText>
            </em> is.
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 17, lineHeight: 1.65, color: C.textDim, maxWidth: 520, marginBottom: 52, fontWeight: 300 }}>
            We help you find yours. Verified Mumbai PGs with transparent pricing, real photos, and a deposit you can actually see.
          </p>

          {/* Quill search bar */}
          <Glass style={{ display: "flex", alignItems: "stretch", maxWidth: 880, padding: 6, borderRadius: 99 }}>
            {[
              ["Where", searchArea, setSearchArea, "Any area in Mumbai"],
              ["Sharing type", searchType, setSearchType, "Single, Double, Triple…"],
              ["Max budget", searchBudget, setSearchBudget, "₹15,000"],
            ].map(([label, value, setValue, placeholder], i, arr) => (
              <div key={label as string} style={{
                flex: 1, padding: "14px 22px",
                borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ fontSize: 8, color: C.textMute, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>{label as string}</div>
                <input
                  value={value as string}
                  onChange={e => (setValue as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                  onFocus={e => { if (e.target.value === placeholder) (setValue as React.Dispatch<React.SetStateAction<string>>)(""); }}
                  style={{ fontSize: 13, color: C.pearl, fontFamily: "var(--font-body)", fontWeight: 500, background: "transparent", border: "none", outline: "none", width: "100%" }}
                />
              </div>
            ))}
            <Magnetic strength={0.2}>
              <Link href={buildSearchUrl()} style={{
                background: `linear-gradient(120deg, ${C.iri1}, ${C.iri2}, ${C.iri3})`,
                color: C.bg0, fontSize: 14, fontWeight: 700, padding: "0 32px",
                borderRadius: 99, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8, minHeight: 52,
                boxShadow: `0 0 28px ${C.iri2}55`, letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: 16 }}>↗</span> Search
              </Link>
            </Magnetic>
          </Glass>

          {/* Stats */}
          <div style={{ display: "flex", gap: 40, marginTop: 52, flexWrap: "wrap" }}>
            {[["1,200+", "verified roosts"], ["8,400+", "happy tenants"], ["₹0", "hidden fees"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, color: C.pearl, letterSpacing: "-0.02em" }}>{n}</div>
                <div style={{ fontSize: 10, color: C.textMute, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", color: C.textMute, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", animation: "pulse 2s ease-in-out infinite", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
          <span>scroll to glide</span>
          <span style={{ fontSize: 16 }}>↓</span>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.4;transform:translateX(-50%) translateY(0)}50%{opacity:.9;transform:translateX(-50%) translateY(5px)}}`}</style>
      </section>

      {/* ── FEATURED LISTINGS ──────────────────────────────────── */}
      <section style={{ padding: "120px 48px", position: "relative" }}>
        <div style={{ maxWidth: 1380, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52 }}>
            <div>
              <div style={{ fontSize: 10, color: C.iri2, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>Featured roosts</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px,4.5vw,60px)", fontWeight: 800, color: C.pearl, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                Six places to <em style={{ fontStyle: "italic" }}><IriText>land softly</IriText></em>.
              </h2>
            </div>
            <Link href="/tenant/search" style={{
              background: "none", border: `1px solid ${C.borderH}`,
              color: C.pearl, fontSize: 13, padding: "11px 24px", borderRadius: 99,
              fontFamily: "var(--font-body)", fontWeight: 500, textDecoration: "none",
              transition: "all .25s", display: "inline-block",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.iri2; e.currentTarget.style.color = C.bg0; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.pearl; }}
            >See all listings →</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {LISTINGS.map((l, i) => <ListingCard key={l.id} listing={l} delay={i * 0.07}/>)}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────────── */}
      <section style={{ padding: "100px 48px", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(38px,4.5vw,60px)", fontWeight: 800, color: C.pearl, letterSpacing: "-0.03em", lineHeight: 1.05, textAlign: "center", marginBottom: 72 }}>
            Built like a <em style={{ fontStyle: "italic" }}><IriText>flock</IriText></em>.<br/>Trusted like family.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { n: "01", t: "Transparent Deposits", d: "See your exact balance at every moment. Every deduction needs a reason — dispute unfair claims directly inside the app." },
              { n: "02", t: "Verified Roosts", d: "Every PG is hand-verified. Photos are real, amenities are accurate, and rules are clearly stated upfront." },
              { n: "03", t: "Razorpay Secure", d: "Pay through Razorpay — money is held safely until your contract begins. No middlemen, no surprises." },
            ].map(f => (
              <Glass key={f.n} style={{ padding: 36, position: "relative", overflow: "hidden", transition: "transform .4s" }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = "translateY(-6px)")}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = "none")}
              >
                <div style={{ position: "absolute", top: -18, right: -18, opacity: 0.04 }}><FeatherDecor size={110} color={C.iri1} opacity={1}/></div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: C.iri2, letterSpacing: "0.22em", marginBottom: 22, fontWeight: 600 }}>{f.n}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: C.pearl, marginBottom: 12, letterSpacing: "-0.02em" }}>{f.t}</h3>
                <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.75 }}>{f.d}</p>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Glass style={{ padding: "72px 60px", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.05))` }}>
            <div style={{ position: "absolute", top: -50, right: -30, opacity: 0.14, transform: "rotate(18deg)" }}><FeatherDecor size={200} color={C.iri1} opacity={1}/></div>
            <div style={{ position: "absolute", bottom: -60, right: 140, opacity: 0.09, transform: "rotate(-14deg)" }}><FeatherDecor size={150} color={C.iri3} opacity={1}/></div>
            <div style={{ position: "relative", zIndex: 2, maxWidth: 640 }}>
              <div style={{ fontSize: 10, color: C.iri2, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 18, fontWeight: 700 }}>For PG Owners</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px,4vw,52px)", fontWeight: 800, color: C.pearl, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 18 }}>
                Open the door.<br/><em style={{ fontStyle: "italic" }}><IriText>The flock will come.</IriText></em>
              </h2>
              <p style={{ fontSize: 15, color: C.textDim, lineHeight: 1.65, marginBottom: 32, maxWidth: 500 }}>
                Reach thousands of verified Mumbai tenants. Manage bookings, deposits, and payments — all from one minimal dashboard.
              </p>
              <Magnetic>
                <Link href="/signup" style={{
                  background: C.pearl, color: C.bg0, fontSize: 14, fontWeight: 700,
                  padding: "15px 34px", borderRadius: 99, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 10,
                  boxShadow: "0 12px 40px rgba(255,255,255,0.18)",
                }}>List your PG →</Link>
              </Magnetic>
            </div>
          </Glass>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ padding: "52px 48px 32px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1380, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.svg" alt="PG Owns" width={28} height={28} className="brightness-0 invert" style={{ opacity: 0.5 }}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "rgba(232,236,244,0.5)" }}>PG Owns</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMute }}>© 2026 PG Owns · Built with feathers in Mumbai</div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Find PGs", "/tenant/search"], ["List PG", "/signup"], ["Sign in", "/login"]].map(([l, h]) => (
              <Link key={l as string} href={h as string} style={{ fontSize: 12, color: C.textMute, textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.pearl)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textMute)}
              >{l as string}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
