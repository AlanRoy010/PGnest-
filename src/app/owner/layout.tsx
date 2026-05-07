"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/owner/listings", label: "My Listings", icon: Home },
  { href: "/owner/bookings", label: "Bookings",    icon: BookOpen },
  { href: "/owner/deposit",  label: "Deposits",    icon: Shield },
];

const D = {
  bg:        "#EEEEEE",
  sidebar:   "rgba(255,255,255,0.55)",
  border:    "rgba(0,0,0,0.07)",
  text:      "#0e1120",
  textDim:   "rgba(10,12,28,0.75)",
  textMute:  "rgba(10,12,28,0.45)",
  activeNav: "rgba(255,255,255,0.88)",
  activeBdr: "rgba(167,139,250,0.45)",
  gradient:  "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
  iris:      "#7c6af4",
};

const IriLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <svg width="26" height="20" viewBox="0 0 40 31">
      <defs>
        <linearGradient id="ol-pm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path fill="url(#ol-pm)" d="M8,20 C6,18 5,15 6,12 C7,8 10,6 14,6 C16,5 18,4 21,5 C25,6 28,9 27,13 C26,16 23,18 20,18 L18,22 C17,24 15,25 13,24 C11,23 10,21 8,20 Z M21,5 C23,3 27,2 30,4 C28,4 26,5 25,7 Z M6,12 C4,11 2,12 2,14 C3,13 5,13 6,12 Z" />
    </svg>
    <div>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 14, color: D.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
        PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
      </div>
      <div style={{ fontSize: 9, color: D.textMute, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 3 }}>Owner</div>
    </div>
  </div>
);

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => setShowSignOutModal(true);

  const confirmSignOut = async () => {
    const supabase = createClient();
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
    } catch {
      console.log("SignOut timed out, clearing locally");
    }
    setShowSignOutModal(false);
    toast.success("Signed out successfully!");
    window.location.href = "/";
  };

  const Sidebar = () => (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: D.sidebar, borderRight: `1px solid ${D.border}`,
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
    }}>
      <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${D.border}` }}>
        <Link href="/"><IriLogo /></Link>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12, paddingLeft: 14, fontWeight: 600 }}>
          Navigation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  textDecoration: "none", transition: "all 0.15s",
                  background: active ? D.activeNav : "transparent",
                  border: active ? `1px solid ${D.activeBdr}` : "1px solid transparent",
                  color: active ? D.text : D.textDim,
                  boxShadow: active ? "0 2px 12px rgba(167,139,250,0.15)" : "none",
                }}
              >
                <item.icon style={{ width: 15, height: 15, flexShrink: 0, color: active ? D.iris : "inherit" }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: "16px 12px", borderTop: `1px solid ${D.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: D.activeNav, border: `1px solid ${D.activeBdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: D.iris }}>
            {profile ? getInitials(profile.full_name) : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11, color: D.textMute }}>{profile?.phone}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, fontSize: 13, color: D.textDim, background: "none", border: "none", cursor: "pointer", width: "100%" }}
        >
          <LogOut style={{ width: 15, height: 15 }} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: D.bg }}>
      <div className="hidden md:flex w-56 flex-shrink-0 fixed h-screen">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 h-full shadow-xl"><Sidebar /></div>
          <div className="flex-1" style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: "rgba(238,238,238,0.72)", borderBottom: `1px solid ${D.border}`, backdropFilter: "blur(20px)" }}>
          <Link href="/"><IriLogo /></Link>
          <button onClick={() => setMobileOpen(true)} style={{ padding: 8, color: D.textDim, background: "none", border: "none", cursor: "pointer" }}>
            <Menu style={{ width: 20, height: 20 }} />
          </button>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {showSignOutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${D.border}`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 360, backdropFilter: "blur(32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <LogOut style={{ width: 18, height: 18, color: "#ef4444" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 6 }}>Sign out?</h2>
            <p style={{ fontSize: 14, color: D.textDim, marginBottom: 24 }}>You&apos;ll need to sign in again to access your dashboard.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowSignOutModal(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 99, border: `1px solid ${D.border}`, color: D.textDim, background: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={confirmSignOut} style={{ flex: 1, padding: "10px 0", borderRadius: 99, background: "linear-gradient(120deg, #ef4444, #dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
