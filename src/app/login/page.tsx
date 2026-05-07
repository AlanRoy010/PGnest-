"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

const D = {
  bg0:      "#0a0c18",
  bg1:      "#0f1224",
  border:   "rgba(255,255,255,0.08)",
  text:     "#e8ecf4",
  textDim:  "rgba(241,243,249,0.62)",
  textMute: "rgba(241,243,249,0.38)",
  gradient: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
  iris:     "#60a5fa",
};

const PANEL_FEATHERS = [
  { top: "12%", left: "8%",  size: 52, color: "#fff",    opacity: 0.55, delay: "0s",   dur: "8s"  },
  { top: "48%", left: "58%", size: 36, color: "#a78bfa", opacity: 0.70, delay: "1.4s", dur: "10s" },
  { top: "72%", left: "14%", size: 28, color: "#60a5fa", opacity: 0.60, delay: "0.6s", dur: "12s" },
  { top: "28%", right: "10%", size: 44, color: "#34d399", opacity: 0.50, delay: "2s",  dur: "9s"  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (!password) { toast.error("Enter your password"); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    toast.success("Welcome back!");

    const redirect = typeof window !== "undefined" ? localStorage.getItem("redirect_after_auth") : null;
    if (redirect) {
      localStorage.removeItem("redirect_after_auth");
      router.refresh();
      router.push(redirect);
      return;
    }

    router.refresh();
    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (profile?.role === "owner") {
      router.push("/owner/listings");
    } else {
      router.push("/tenant/search");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: D.bg0 }}>
      {/* Left cinematic panel — desktop only */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col items-center justify-center"
        style={{ background: `linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.08), rgba(52,211,153,0.06)), ${D.bg1}`, padding: 60 }}
      >
        {PANEL_FEATHERS.map((f, i) => (
          <div
            key={i}
            className="absolute pointer-events-none animate-feather-float"
            style={{
              top: f.top,
              left: "left" in f ? (f as { left: string }).left : undefined,
              right: "right" in f ? (f as { right: string }).right : undefined,
              animationDelay: f.delay,
              animationDuration: f.dur,
              opacity: f.opacity,
            }}
          >
            <svg width={f.size} height={f.size * 3} viewBox="0 0 24 80" fill={f.color}>
              <path d="M12 2 C 12 2, 22 18, 20 38 C 18 58, 13 75, 12 78 C 11 75, 6 58, 4 38 C 2 18, 12 2, 12 2 Z" />
            </svg>
          </div>
        ))}

        <div style={{ position: "relative", zIndex: 2, maxWidth: 520, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 36 }}>
            <svg width="40" height="31" viewBox="0 0 40 31">
              <defs>
                <linearGradient id="login-pm" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" /><stop offset="50%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path fill="url(#login-pm)" d="M8,20 C6,18 5,15 6,12 C7,8 10,6 14,6 C16,5 18,4 21,5 C25,6 28,9 27,13 C26,16 23,18 20,18 L18,22 C17,24 15,25 13,24 C11,23 10,21 8,20 Z M21,5 C23,3 27,2 30,4 C28,4 26,5 25,7 Z M6,12 C4,11 2,12 2,14 C3,13 5,13 6,12 Z" />
            </svg>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: D.text, letterSpacing: "-0.02em" }}>
              PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
            </div>
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 20 }}>
            Every flight starts with{" "}
            <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              one feather
            </em>.
          </h2>
          <p style={{ fontSize: 15, color: D.textDim, lineHeight: 1.6 }}>
            Sign in to access your roost, manage your deposit, and find your next nest.
          </p>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 32 }}>
            {[["1,200+", "Verified PGs"], ["8,400+", "Happy tenants"], ["₹0", "Hidden fees"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: D.text }}>{n}</div>
                <div style={{ fontSize: 10, color: D.textMute, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex flex-col" style={{ background: D.bg0 }}>
        {/* Mobile nav */}
        <nav className="lg:hidden" style={{ padding: "16px 24px", borderBottom: `1px solid ${D.border}`, background: "rgba(15,18,36,0.9)", backdropFilter: "blur(12px)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="24" height="19" viewBox="0 0 40 31">
              <defs><linearGradient id="login-mob" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="50%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#34d399" /></linearGradient></defs>
              <path fill="url(#login-mob)" d="M8,20 C6,18 5,15 6,12 C7,8 10,6 14,6 C16,5 18,4 21,5 C25,6 28,9 27,13 C26,16 23,18 20,18 L18,22 C17,24 15,25 13,24 C11,23 10,21 8,20 Z M21,5 C23,3 27,2 30,4 C28,4 26,5 25,7 Z M6,12 C4,11 2,12 2,14 C3,13 5,13 6,12 Z" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17, color: D.text }}>PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em></span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center" style={{ padding: "48px 48px" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <Link href="/" className="hidden lg:inline-flex" style={{ fontSize: 12, color: D.textMute, marginBottom: 32, textDecoration: "none" }}>
              ← Back to home
            </Link>

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>Welcome back</div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                Land into{" "}
                <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  your nest
                </em>.
              </h1>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Email</div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com" style={inputSt}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>Password</div>
                  <Link href="/forgot-password" style={{ fontSize: 12, color: D.iris, textDecoration: "none" }}>Forgot password?</Link>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" style={inputSt}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <Magnetic strength={0.15} style={{ display: "block", marginTop: 8 }}>
                <button
                  onClick={handleLogin}
                  disabled={loading || !email.trim() || !password}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 99,
                    background: D.gradient, color: "#0a0c18", fontSize: 14, fontWeight: 700,
                    border: "none", cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: "0 12px 40px rgba(96,165,250,0.27)",
                    opacity: loading || !email.trim() || !password ? 0.6 : 1,
                  }}
                >
                  {loading ? <PigeonLoader size="sm" /> : <>Sign in <ArrowRight style={{ width: 16, height: 16 }} /></>}
                </button>
              </Magnetic>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${D.border}`, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: D.textDim }}>
                New to the flock?{" "}
                <Link href="/signup" style={{ color: D.iris, fontWeight: 600, textDecoration: "none" }}>Create account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14, padding: "15px 20px", fontSize: 14, outline: "none", color: "#e8ecf4",
  boxSizing: "border-box",
};
