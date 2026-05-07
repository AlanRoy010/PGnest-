"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Home, Search, ArrowLeft, Mail, Lock, User } from "lucide-react";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

type Role = "tenant" | "owner";

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
  { top: "8%",  left: "12%",  size: 44, color: "#fff",    opacity: 0.5,  delay: "0.5s", dur: "9s"  },
  { top: "52%", left: "62%",  size: 32, color: "#a78bfa", opacity: 0.65, delay: "0s",   dur: "11s" },
  { top: "75%", left: "10%",  size: 24, color: "#60a5fa", opacity: 0.55, delay: "2s",   dur: "8s"  },
  { top: "32%", right: "8%",  size: 48, color: "#34d399", opacity: 0.45, delay: "1s",   dur: "10s" },
];

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("tenant");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim()) { toast.error("Enter your full name"); return; }
    if (!email.trim()) { toast.error("Enter your email"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName.trim(), role }, emailRedirectTo: undefined },
      });
      if (signUpError) { toast.error(signUpError.message); return; }

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Failed to send OTP"); return; }
      toast.success("OTP sent to your email!");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Invalid or expired OTP"); return; }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { toast.error(signInError.message); return; }

      toast.success("Email verified! Welcome aboard.");

      const redirect = typeof window !== "undefined" ? localStorage.getItem("redirect_after_auth") : null;
      if (redirect) {
        localStorage.removeItem("redirect_after_auth");
        router.refresh();
        router.push(redirect);
        return;
      }
      router.refresh();
      router.push(role === "owner" ? "/owner/listings" : "/tenant/search");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Failed to resend"); return; }
      toast.success("OTP resent!");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: D.bg0 }}>
      {/* Left cinematic panel — desktop only */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col items-center justify-center"
        style={{ background: `linear-gradient(135deg, rgba(167,139,250,0.18), rgba(96,165,250,0.1), rgba(52,211,153,0.08)), ${D.bg1}`, padding: 60 }}
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
                <linearGradient id="signup-pm" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" /><stop offset="50%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path fill="url(#signup-pm)" d="M8,20 C6,18 5,15 6,12 C7,8 10,6 14,6 C16,5 18,4 21,5 C25,6 28,9 27,13 C26,16 23,18 20,18 L18,22 C17,24 15,25 13,24 C11,23 10,21 8,20 Z M21,5 C23,3 27,2 30,4 C28,4 26,5 25,7 Z M6,12 C4,11 2,12 2,14 C3,13 5,13 6,12 Z" />
            </svg>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: D.text, letterSpacing: "-0.02em" }}>
              PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
            </div>
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 20 }}>
            Open the door.{" "}
            <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              The flock will come.
            </em>
          </h2>
          <p style={{ fontSize: 15, color: D.textDim, lineHeight: 1.6 }}>
            Join thousands of tenants and owners building a better PG experience across Mumbai.
          </p>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 32 }}>
            {[["₹0", "Platform fee"], ["24h", "Fast approval"], ["100%", "Transparent"]].map(([n, l]) => (
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
              <defs><linearGradient id="signup-mob" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="50%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#34d399" /></linearGradient></defs>
              <path fill="url(#signup-mob)" d="M8,20 C6,18 5,15 6,12 C7,8 10,6 14,6 C16,5 18,4 21,5 C25,6 28,9 27,13 C26,16 23,18 20,18 L18,22 C17,24 15,25 13,24 C11,23 10,21 8,20 Z M21,5 C23,3 27,2 30,4 C28,4 26,5 25,7 Z M6,12 C4,11 2,12 2,14 C3,13 5,13 6,12 Z" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17, color: D.text }}>PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em></span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center" style={{ padding: "40px 48px" }}>
          <div style={{ width: "100%", maxWidth: 380 }}>
            <Link href="/" className="hidden lg:inline-flex" style={{ fontSize: 12, color: D.textMute, marginBottom: 28, textDecoration: "none" }}>
              ← Back to home
            </Link>

            {step === 1 ? (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Join PG Owns</div>
                  <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    Find your{" "}
                    <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      perfect nest
                    </em>.
                  </h1>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Role selector */}
                  <div>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>I am a</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {([
                        { value: "tenant", label: "Tenant", sub: "Looking for a PG", icon: Search },
                        { value: "owner",  label: "Owner",  sub: "Listing my PG",    icon: Home  },
                      ] as const).map(({ value, label, sub, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            padding: "16px 12px", borderRadius: 14, cursor: "pointer",
                            background: role === value
                              ? "linear-gradient(120deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))"
                              : "rgba(255,255,255,0.03)",
                            border: role === value ? "1px solid rgba(96,165,250,0.4)" : `1px solid ${D.border}`,
                          }}
                        >
                          <Icon style={{ width: 18, height: 18, color: role === value ? D.iris : D.textMute }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: role === value ? D.text : D.textDim }}>{label}</span>
                          <span style={{ fontSize: 10, color: D.textMute, lineHeight: 1.3, textAlign: "center" }}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Full name</div>
                    <div style={{ position: "relative" }}>
                      <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.textMute }} />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" style={{ ...inputSt, paddingLeft: 40 }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Email address</div>
                    <div style={{ position: "relative" }}>
                      <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.textMute }} />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...inputSt, paddingLeft: 40 }} onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Password</div>
                    <div style={{ position: "relative" }}>
                      <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.textMute }} />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ ...inputSt, paddingLeft: 40 }} onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }} />
                    </div>
                  </div>

                  <Magnetic strength={0.15} style={{ display: "block", marginTop: 4 }}>
                    <button
                      onClick={handleSignUp} disabled={loading}
                      style={{ width: "100%", padding: "14px", borderRadius: 99, background: D.gradient, color: "#0a0c18", fontSize: 14, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(96,165,250,0.27)", opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? <PigeonLoader size="sm" /> : "Continue →"}
                    </button>
                  </Magnetic>
                </div>

                <p style={{ textAlign: "center", fontSize: 13, color: D.textDim, marginTop: 24 }}>
                  Already have an account?{" "}
                  <Link href="/login" style={{ color: D.iris, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setStep(1); setOtp(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: D.textDim, background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0 }}
                >
                  <ArrowLeft style={{ width: 15, height: 15 }} /> Back
                </button>

                <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(120deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))", border: "1px solid rgba(96,165,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Mail style={{ width: 22, height: 22, color: D.iris }} />
                </div>
                <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Almost there</div>
                <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 10 }}>
                  Check your{" "}
                  <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>inbox</em>.
                </h1>
                <p style={{ fontSize: 14, color: D.textDim, marginBottom: 28 }}>
                  We sent a 6-digit code to{" "}
                  <span style={{ fontWeight: 600, color: D.text }}>{email}</span>
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Verification code</div>
                    <input
                      type="text" inputMode="numeric" maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      style={{ ...inputSt, fontSize: 24, fontWeight: 600, letterSpacing: "0.5em", textAlign: "center" }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                    />
                  </div>

                  <Magnetic strength={0.15} style={{ display: "block" }}>
                    <button
                      onClick={handleVerify} disabled={loading || otp.length !== 6}
                      style={{ width: "100%", padding: "14px", borderRadius: 99, background: D.gradient, color: "#0a0c18", fontSize: 14, fontWeight: 700, border: "none", cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(96,165,250,0.27)", opacity: loading || otp.length !== 6 ? 0.6 : 1 }}
                    >
                      {loading ? <PigeonLoader size="sm" /> : "Verify & continue"}
                    </button>
                  </Magnetic>

                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 13, color: D.textDim }}>Didn&apos;t receive it? </span>
                    <button
                      onClick={handleResend} disabled={resending}
                      style={{ fontSize: 13, color: D.iris, fontWeight: 600, background: "none", border: "none", cursor: "pointer", opacity: resending ? 0.5 : 1 }}
                    >
                      {resending ? "Sending..." : "Resend code"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14, padding: "14px 18px", fontSize: 14, outline: "none", color: "#e8ecf4",
  boxSizing: "border-box",
};
