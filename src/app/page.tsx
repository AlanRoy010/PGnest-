"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Magnetic, TiltCard } from "@/components/FeatherFX";
import { ShieldCheck, Star, Zap } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────
const C = {
  bg:       "#EEEEEE",
  bg1:      "#E4E4E4",
  glass:    "rgba(255,255,255,0.52)",
  glassBorder: "rgba(255,255,255,0.72)",
  text:     "#0e1120",
  textDim:  "rgba(10,12,28,0.82)",
  textMute: "rgba(10,12,28,0.58)",
  border:   "rgba(255,255,255,0.55)",
  card:     "rgba(255,255,255,0.48)",
  iri1:     "#a78bfa",
  iri2:     "#60a5fa",
  iri3:     "#34d399",
  iri4:     "#f472b6",
  grad:     "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ── Data ───────────────────────────────────────────────────────
const LISTINGS = [
  { id: 1, title: "Andheri Premium Roost",  area: "Andheri West", rent: 12000, type: "Double",  verified: true,  rooms: 2, total: 3, iri: "250,75%" },
  { id: 2, title: "Bandra Pearl Loft",       area: "Bandra",       rent: 18000, type: "Single",  verified: true,  rooms: 1, total: 2, iri: "290,65%" },
  { id: 3, title: "Powai Lake Sanctuary",    area: "Powai",        rent: 15000, type: "Triple",  verified: true,  rooms: 3, total: 4, iri: "190,55%" },
  { id: 4, title: "Malad Student Nest",      area: "Malad",        rent: 8000,  type: "Dorm",    verified: false, rooms: 5, total: 8, iri: "220,60%" },
  { id: 5, title: "Goregaon Glass House",    area: "Goregaon",     rent: 11000, type: "Double",  verified: true,  rooms: 1, total: 3, iri: "260,70%" },
  { id: 6, title: "Dadar Heritage Eyrie",    area: "Dadar",        rent: 13500, type: "Single",  verified: true,  rooms: 0, total: 2, iri: "230,65%" },
];

// ── Helpers ────────────────────────────────────────────────────
function IriText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: C.grad, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {children}
    </span>
  );
}

function Card({ children, style = {}, hover = false, ...rest }: React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties; hover?: boolean }) {
  return (
    <div style={{
      background: hover ? "rgba(255,255,255,0.62)" : C.card,
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      border: `1px solid ${hover ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.55)"}`,
      borderRadius: 20,
      boxShadow: hover
        ? "0 20px 60px rgba(96,165,250,0.14), 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"
        : "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
      transition: "all 0.35s cubic-bezier(.2,.9,.3,1)",
      ...style,
    }} {...rest}>
      {children}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: scrolled ? "14px 56px" : "22px 56px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.4s cubic-bezier(.2,.9,.3,1)",
      background: scrolled ? "rgba(238,238,238,0.45)" : "transparent",
      backdropFilter: scrolled ? "blur(32px) saturate(180%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(32px) saturate(180%)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
        <Image src="/logo.svg" alt="PG Owns" width={48} height={48} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
          PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
        </div>
      </Link>

      <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
        {[["Find PGs", "/tenant/search"], ["My Bookings", "/tenant/bookings"], ["My Deposit", "/tenant/deposit"]].map(([label, href]) => (
          <Link key={label} href={href} style={{ fontSize: 13, fontWeight: 500, color: C.textDim, textDecoration: "none", transition: "color .2s", letterSpacing: "0.01em" }}
            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
          >{label}</Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/login" style={{ fontSize: 13, color: C.textDim, padding: "8px 14px", textDecoration: "none", transition: "color .2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text)}
          onMouseLeave={e => (e.currentTarget.style.color = C.textDim)}
        >Sign In</Link>
        <Magnetic strength={0.2}>
          <Link href="/signup" style={{
            background: C.text, color: "#fff", fontSize: 13, fontWeight: 700,
            padding: "10px 22px", borderRadius: 99, textDecoration: "none",
            display: "inline-block", letterSpacing: "0.04em", textTransform: "uppercase",
            boxShadow: "0 4px 20px rgba(20,23,43,0.18)",
          }}>
            Join Now
          </Link>
        </Magnetic>
      </div>
    </nav>
  );
}

// ── Listing card ───────────────────────────────────────────────
function ListingCard({ listing, delay = 0 }: { listing: typeof LISTINGS[0]; delay?: number }) {
  const [hover, setHover] = useState(false);
  return (
    <TiltCard max={4} style={{ animationDelay: `${delay}s` }}>
      <Link href="/tenant/search" style={{ textDecoration: "none", display: "block" }}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <Card hover={hover} style={{ overflow: "hidden", padding: 0 }}>
          {/* Iridescent top accent */}
          <div style={{ height: 3, background: C.grad, opacity: hover ? 1 : 0, transition: "opacity .3s" }} />
          {/* Photo placeholder */}
          <div style={{ height: 190, position: "relative", overflow: "hidden", background: `linear-gradient(135deg, hsla(${listing.iri},85%,94%), hsla(${listing.iri},70%,88%))` }}>
            {/* Shimmer */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)",
              transform: hover ? "translateX(30%)" : "translateX(-120%)",
              transition: "transform 1s cubic-bezier(.2,.9,.3,1)",
            }}/>
            {listing.verified && (
              <div style={{
                position: "absolute", top: 12, left: 12, padding: "5px 11px", borderRadius: 99,
                background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
                fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 5,
                color: C.iri2, border: `1px solid rgba(96,165,250,0.25)`,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.iri3 }}/>
                Verified
              </div>
            )}
            <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", fontSize: 10, color: C.textDim, fontWeight: 500 }}>
              {listing.type}
            </div>
            <div style={{ position: "absolute", bottom: 12, right: 12, display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", fontSize: 11, color: C.text, fontWeight: 600 }}>
              <span style={{ color: "#f59e0b" }}>★</span> 4.7
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px 20px" }}>
            <div style={{ fontSize: 10, color: C.textMute, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5, fontWeight: 600 }}>{listing.area}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 14, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{listing.title}</h3>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                  {fmt(listing.rent)}<span style={{ fontSize: 11, fontWeight: 400, color: C.textMute }}>/mo</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMute, marginTop: 2 }}>{listing.rooms} of {listing.total} rooms left</div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: hover ? C.grad : C.bg1,
                color: hover ? "#fff" : C.textDim, fontSize: 14, fontWeight: 700, transition: "all .3s",
              }}>→</div>
            </div>
          </div>
        </Card>
      </Link>
    </TiltCard>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pigeonOpacity = Math.max(0, 0.7 * (1 - scrollY / (typeof window !== "undefined" ? window.innerHeight * 0.7 : 600)));

  const buildSearchUrl = () => {
    const qs = searchQuery.trim() ? `?q=${encodeURIComponent(searchQuery.trim())}` : "";
    return `/tenant/search${qs}`;
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, overflowX: "hidden" }}>
      <Nav scrolled={scrollY > 40} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 100px", textAlign: "center" }}>

        {/* Iridescent aura blobs */}
        <div style={{ position: "absolute", top: "-5%", left: "55%", width: 700, height: 700, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri1}18, transparent 65%)`, filter: "blur(80px)", pointerEvents: "none", transform: `translateY(${scrollY * 0.18}px)` }}/>
        <div style={{ position: "absolute", top: "30%", right: "-8%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri2}14, transparent 65%)`, filter: "blur(80px)", pointerEvents: "none", transform: `translateY(${scrollY * 0.28}px)` }}/>
        <div style={{ position: "absolute", bottom: "5%", left: "20%", width: 560, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri3}10, transparent 65%)`, filter: "blur(100px)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: "18%", left: "-5%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri4}0d, transparent 65%)`, filter: "blur(80px)", pointerEvents: "none" }}/>

        {/* Glass pigeon — fixed, fades out as hero exits */}
        <div style={{
          position: "fixed", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: "100vw", height: "100vw",
          opacity: pigeonOpacity,
          pointerEvents: "none",
          zIndex: 0,
          maskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
          transition: "opacity 0.1s linear",
        }}>
          <Image src="/glass-pigeon.png" alt="" fill style={{ objectFit: "contain" }} />
        </div>

        <div style={{ position: "relative", zIndex: 10, maxWidth: 720, width: "100%" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "8px 20px", borderRadius: 99, background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}`, backdropFilter: "blur(12px)" }}>
            <span style={{ width: 24, height: 1.5, background: C.grad, borderRadius: 99, display: "inline-block" }}/>
            <span style={{ fontSize: 10, color: "#1a5fa8", letterSpacing: "0.32em", textTransform: "uppercase", fontWeight: 700 }}>
              Mumbai&apos;s most loved PG platform
            </span>
          </div>

          {/* Subtext */}
          <p style={{ fontFamily: "var(--font-body)", fontSize: 20, lineHeight: 1.7, color: C.textDim, maxWidth: 540, margin: "0 auto 52px", fontWeight: 500 }}>
            We help you find yours. Verified Mumbai PGs with transparent pricing, real photos, and a deposit you can actually see.
          </p>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", maxWidth: 600, margin: "0 auto 48px", padding: 6, borderRadius: 99, background: "rgba(255,255,255,0.52)", backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") window.location.href = buildSearchUrl(); }}
              placeholder="Search by area, locality, or PG name…"
              style={{ flex: 1, padding: "13px 22px", fontSize: 14, color: C.text, fontFamily: "var(--font-body)", fontWeight: 500, background: "transparent", border: "none", outline: "none" }}
            />
            <Magnetic strength={0.2}>
              <Link href={buildSearchUrl()} style={{
                background: C.grad, color: "#fff", fontSize: 13, fontWeight: 700,
                padding: "0 30px", borderRadius: 99, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8, minHeight: 50,
                boxShadow: `0 8px 28px ${C.iri1}40`, letterSpacing: "0.04em",
                whiteSpace: "nowrap", transition: "box-shadow .3s",
              }}>
                Search →
              </Link>
            </Magnetic>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
            {[
              { icon: ShieldCheck, label: "Verified Properties" },
              { icon: Zap,         label: "Secure Payments" },
              { icon: Star,        label: "Elite Community" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textDim, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
                <Icon style={{ width: 14, height: 14, color: C.iri2 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ position: "relative", zIndex: 5, display: "flex", gap: 56, marginTop: 80, flexWrap: "wrap", justifyContent: "center" }}>
          {[["1,200+", "verified roosts"], ["8,400+", "happy tenants"], ["₹0", "hidden fees"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", background: C.grad, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        
      </section>

      {/* ── FEATURED LISTINGS ──────────────────────────────────── */}
      <section style={{ padding: "120px 56px", position: "relative" }}>
        {/* Subtle aura behind section */}
        <div style={{ position: "absolute", top: "20%", left: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri1}0c, transparent 65%)`, filter: "blur(80px)", pointerEvents: "none" }}/>
        <div style={{ maxWidth: 1380, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56 }}>
            <div>
              <div style={{ fontSize: 10, color: C.iri2, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 14, fontWeight: 700 }}>Featured roosts</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px,3.8vw,54px)", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                Six places to <em style={{ fontStyle: "italic" }}><IriText>land softly</IriText></em>.
              </h2>
            </div>
            <Link href="/tenant/search" style={{
              background: "none", border: `1.5px solid ${C.border}`,
              color: C.textDim, fontSize: 13, padding: "11px 24px", borderRadius: 99,
              fontWeight: 500, textDecoration: "none", transition: "all .25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.iri2; e.currentTarget.style.color = C.iri2; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
            >See all listings →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {LISTINGS.map((l, i) => <ListingCard key={l.id} listing={l} delay={i * 0.07}/>)}
          </div>
        </div>
      </section>

      {/* ── WHY US ─────────────────────────────────────────────── */}
      <section style={{ padding: "100px 56px", position: "relative" }}>
        <div style={{ position: "absolute", top: "30%", right: "-5%", width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri3}0e, transparent 65%)`, filter: "blur(80px)", pointerEvents: "none" }}/>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px,4vw,54px)", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05, textAlign: "center", marginBottom: 72 }}>
            Built like a <em style={{ fontStyle: "italic" }}><IriText>flock</IriText></em>.<br/>Trusted like family.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { n: "01", t: "Transparent Deposits", d: "See your exact balance at every moment. Every deduction needs a reason — dispute unfair claims directly inside the app." },
              { n: "02", t: "Verified Roosts",       d: "Every PG is hand-verified. Photos are real, amenities are accurate, and rules are clearly stated upfront." },
              { n: "03", t: "Razorpay Secure",       d: "Pay through Razorpay — money is held safely until your contract begins. No middlemen, no surprises." },
            ].map((f, idx) => {
              const colors = [C.iri1, C.iri2, C.iri3];
              return (
                <Card key={f.n} style={{ padding: 36, position: "relative", overflow: "hidden", cursor: "default" }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 24px 60px rgba(96,165,250,0.14)"; }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 24px rgba(20,23,43,0.07)"; }}
                >
                  {/* Iridescent corner accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.grad, opacity: 0.6 }}/>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: colors[idx], letterSpacing: "0.22em", marginBottom: 22, fontWeight: 600 }}>{f.n}</div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 12, letterSpacing: "-0.02em" }}>{f.t}</h3>
                  <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.75 }}>{f.d}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "100px 56px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Card style={{ padding: "72px 64px", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, rgba(167,139,250,0.08), rgba(96,165,250,0.05), rgba(52,211,153,0.04))` }}>
            {/* Iridescent top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.grad }}/>
            {/* Aura decoration */}
            <div style={{ position: "absolute", top: -80, right: -60, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.iri1}18, transparent 65%)`, filter: "blur(60px)", pointerEvents: "none" }}/>
            <div style={{ position: "relative", zIndex: 2, maxWidth: 600 }}>
              <div style={{ fontSize: 10, color: C.iri2, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 20, fontWeight: 700 }}>For PG Owners</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(30px,3.8vw,50px)", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 18 }}>
                Open the door.<br/><em style={{ fontStyle: "italic" }}><IriText>The flock will come.</IriText></em>
              </h2>
              <p style={{ fontSize: 15, color: C.textDim, lineHeight: 1.65, marginBottom: 36, maxWidth: 500 }}>
                Reach thousands of verified Mumbai tenants. Manage bookings, deposits, and payments — all from one minimal dashboard.
              </p>
              <Magnetic>
                <Link href="/signup" style={{
                  background: C.grad, color: "#fff", fontSize: 14, fontWeight: 700,
                  padding: "15px 36px", borderRadius: 99, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 10,
                  boxShadow: `0 12px 40px ${C.iri1}30`, transition: "box-shadow .3s",
                }}>List your PG →</Link>
              </Magnetic>
            </div>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ padding: "52px 56px 36px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1380, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.svg" alt="PG Owns" width={26} height={26} style={{ opacity: 0.5 }}/>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: C.textMute }}>PG Owns</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMute }}>© 2026 PG Owns · Built with care in Mumbai</div>
          <div style={{ display: "flex", gap: 28 }}>
            {[["Find PGs", "/tenant/search"], ["List PG", "/signup"], ["Sign in", "/login"]].map(([l, h]) => (
              <Link key={l as string} href={h as string} style={{ fontSize: 12, color: C.textMute, textDecoration: "none", transition: "color .2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textMute)}
              >{l as string}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
