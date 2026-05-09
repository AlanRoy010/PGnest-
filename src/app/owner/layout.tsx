"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, Shield, LogOut, UserCircle, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/owner/listings", label: "My Listings", icon: Home },
  { href: "/owner/bookings", label: "Bookings",    icon: BookOpen },
  { href: "/owner/deposit",  label: "Deposits",    icon: Shield },
];

const D = {
  bg:      "#EEEEEE",
  border:  "rgba(0,0,0,0.08)",
  text:    "#0e1120",
  textDim: "rgba(14,17,32,0.6)",
  teal:    "#0D9E8F",
  grad:    "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, email } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const confirmSignOut = async () => {
    const supabase = createClient();
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
    } catch { /* timeout — clear locally */ }
    setShowSignOutModal(false);
    toast.success("Signed out successfully!");
    window.location.href = "/";
  };

  return (
    <div style={{ background: D.bg, minHeight: "100vh" }}>

      {/* ── Top navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? "14px 56px" : "22px 56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(238,238,238,0.45)" : "transparent",
        backdropFilter: scrolled ? "blur(32px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(32px) saturate(180%)" : "none",
        borderBottom: scrolled ? `1px solid ${D.border}` : "1px solid transparent",
        transition: "all 0.4s cubic-bezier(.2,.9,.3,1)",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <Image src="/logo.svg" alt="PG Owns" width={48} height={48} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26, color: D.text, letterSpacing: "-0.03em" }}>
            PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
          </span>
        </Link>

        {/* Nav items — desktop */}
        <div className="hidden md:flex" style={{ gap: 4, alignItems: "center" }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: active ? 600 : 500,
                  textDecoration: "none", transition: "all 0.15s",
                  background: active ? "rgba(255,255,255,0.85)" : "transparent",
                  color: active ? D.teal : D.textDim,
                  border: active ? "1px solid rgba(13,158,143,0.25)" : "1px solid transparent",
                  boxShadow: active ? "0 1px 8px rgba(13,158,143,0.12)" : "none",
                }}
              >
                <item.icon style={{ width: 14, height: 14 }} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex" style={{ gap: 8, alignItems: "center" }}>
          <Link href="/owner/profile" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px", borderRadius: 99, background: "rgba(255,255,255,0.7)", border: `1px solid ${D.border}`, textDecoration: "none", fontSize: 13, color: D.text, fontWeight: 500 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: D.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
              {profile?.full_name ? getInitials(profile.full_name) : email ? email[0].toUpperCase() : "O"}
            </div>
            {profile?.full_name?.split(" ")[0] || email?.split("@")[0]}
          </Link>
          <button onClick={() => setShowSignOutModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 99, background: "none", border: `1px solid ${D.border}`, color: D.textDim, fontSize: 13, cursor: "pointer" }}>
            <LogOut style={{ width: 13, height: 13 }} /> Sign out
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(o => !o)} style={{ padding: 8, background: "none", border: "none", cursor: "pointer", color: D.textDim }}>
          {mobileOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: "fixed", top: 64, left: 0, right: 0, zIndex: 99, background: "rgba(238,238,238,0.97)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${D.border}`, padding: "12px 24px 20px" }}>
          {NAV_ITEMS.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, fontSize: 14, fontWeight: active ? 600 : 400, textDecoration: "none", color: active ? D.teal : D.textDim, background: active ? "rgba(255,255,255,0.8)" : "transparent" }}
              >
                <item.icon style={{ width: 16, height: 16 }} />
                {item.label}
              </Link>
            );
          })}
          <div style={{ borderTop: `1px solid ${D.border}`, marginTop: 12, paddingTop: 12 }}>
            <button onClick={() => setShowSignOutModal(true)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: D.textDim, background: "none", border: "none", cursor: "pointer", padding: "11px 14px" }}>
              <LogOut style={{ width: 16, height: 16 }} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ paddingTop: 80 }}>
        {children}
      </main>

      {/* Sign out modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, backdropFilter: "blur(32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <LogOut style={{ width: 18, height: 18, color: "#ef4444" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 6 }}>Sign out?</h2>
            <p style={{ fontSize: 14, color: D.textDim, marginBottom: 24 }}>You&apos;ll need to sign in again to access your dashboard.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowSignOutModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 99, border: `1px solid ${D.border}`, color: D.textDim, background: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>Cancel</button>
              <button onClick={confirmSignOut} style={{ flex: 1, padding: "10px 0", borderRadius: 99, background: "linear-gradient(120deg, #ef4444, #dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
