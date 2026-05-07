"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Home, Search, ArrowLeft, Mail, Lock, User } from "lucide-react";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

type Role = "tenant" | "owner";

const D = {
  bg:       "#EEEEEE",
  border:   "rgba(0,0,0,0.07)",
  text:     "#0e1120",
  textDim:  "rgba(10,12,28,0.75)",
  textMute: "rgba(10,12,28,0.45)",
  gradient: "linear-gradient(120deg, #a78bfa, #60a5fa, #34d399)",
  iris:     "#7c6af4",
};

const inputSt: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.09)",
  borderRadius: 14, padding: "14px 18px", fontSize: 14, outline: "none", color: "#0e1120",
  boxSizing: "border-box", backdropFilter: "blur(12px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
};

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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Failed to send OTP"); return; }
      toast.success("OTP sent to your email!");
      setStep(2);
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Invalid or expired OTP"); return; }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { toast.error(signInError.message); return; }
      toast.success("Email verified! Welcome aboard.");
      const redirect = typeof window !== "undefined" ? localStorage.getItem("redirect_after_auth") : null;
      if (redirect) { localStorage.removeItem("redirect_after_auth"); router.refresh(); router.push(redirect); return; }
      router.refresh();
      router.push(role === "owner" ? "/owner/listings" : "/tenant/search");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success) { toast.error(result.error || "Failed to resend"); return; }
      toast.success("OTP resent!");
    } finally { setResending(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: D.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "40px 24px" }}>

      {/* Glass pigeon background */}
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: "100vw", height: "100vw",
        opacity: 0.7, pointerEvents: "none", zIndex: 0,
        maskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 55% at center, black 35%, transparent 72%)",
      }}>
        <Image src="/glass-pigeon.png" alt="" fill style={{ objectFit: "contain" }} />
      </div>

      {/* Aura blobs */}
      <div style={{ position: "fixed", top: "10%", right: "12%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.13), transparent 65%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "8%", left: "8%", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.11), transparent 65%)", filter: "blur(70px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Back link */}
      <Link href="/" style={{ position: "fixed", top: 28, left: 40, fontSize: 13, color: D.textMute, textDecoration: "none", zIndex: 10 }}>
        ← Back to home
      </Link>

      {/* Form card */}
      <div style={{
        position: "relative", zIndex: 10,
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 24, padding: "40px 40px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <Image src="/logo.svg" alt="PG Owns" width={40} height={40} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: D.text, letterSpacing: "-0.03em" }}>
            PG <em style={{ fontStyle: "italic", fontWeight: 400 }}>Owns</em>
          </span>
        </div>

        {step === 1 ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600 }}>Join PG Owns</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Role selector */}
              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>I am a</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {([
                    { value: "tenant", label: "Tenant", sub: "Looking for a PG", icon: Search },
                    { value: "owner",  label: "Owner",  sub: "Listing my PG",    icon: Home  },
                  ] as const).map(({ value, label, sub, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setRole(value)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "14px 12px", borderRadius: 14, cursor: "pointer",
                      background: role === value ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)",
                      border: role === value ? "1px solid rgba(124,106,244,0.4)" : "1px solid rgba(0,0,0,0.07)",
                      boxShadow: role === value ? "0 2px 12px rgba(124,106,244,0.15)" : "none",
                    }}>
                      <Icon style={{ width: 17, height: 17, color: role === value ? D.iris : D.textMute }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: role === value ? D.text : D.textDim }}>{label}</span>
                      <span style={{ fontSize: 10, color: D.textMute, lineHeight: 1.3, textAlign: "center" }}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Full name</div>
                <div style={{ position: "relative" }}>
                  <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.text }} />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" style={{ ...inputSt, paddingLeft: 40 }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Email address</div>
                <div style={{ position: "relative" }}>
                  <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.text }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...inputSt, paddingLeft: 40 }} onKeyDown={e => { if (e.key === "Enter") handleSignUp(); }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Password</div>
                <div style={{ position: "relative" }}>
                  <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: D.text }} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ ...inputSt, paddingLeft: 40 }} onKeyDown={e => { if (e.key === "Enter") handleSignUp(); }} />
                </div>
              </div>

              <Magnetic strength={0.15} style={{ display: "block", marginTop: 4 }}>
                <button onClick={handleSignUp} disabled={loading} style={{
                  width: "100%", padding: "14px", borderRadius: 99,
                  background: D.gradient, color: "#fff", fontSize: 14, fontWeight: 700,
                  border: "none", cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(124,106,244,0.28)", opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? <PigeonLoader size="sm" /> : "Continue →"}
                </button>
              </Magnetic>
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: D.textDim, marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: D.iris, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <button onClick={() => { setStep(1); setOtp(""); }} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: D.textDim, background: "none", border: "none", cursor: "pointer", marginBottom: 20, padding: 0 }}>
              <ArrowLeft style={{ width: 15, height: 15 }} /> Back
            </button>

            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(124,106,244,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 2px 12px rgba(124,106,244,0.12)" }}>
              <Mail style={{ width: 22, height: 22, color: D.iris }} />
            </div>
            <div style={{ fontSize: 11, color: D.iris, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Almost there</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color: D.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 8 }}>
              Check your{" "}
              <em style={{ fontStyle: "italic", background: D.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>inbox</em>.
            </h1>
            <p style={{ fontSize: 14, color: D.textDim, marginBottom: 24 }}>
              We sent a 6-digit code to <span style={{ fontWeight: 600, color: D.text }}>{email}</span>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: D.textMute, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Verification code</div>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  style={{ ...inputSt, fontSize: 24, fontWeight: 600, letterSpacing: "0.5em", textAlign: "center" }}
                  onKeyDown={e => { if (e.key === "Enter") handleVerify(); }}
                />
              </div>

              <Magnetic strength={0.15} style={{ display: "block" }}>
                <button onClick={handleVerify} disabled={loading || otp.length !== 6} style={{
                  width: "100%", padding: "14px", borderRadius: 99,
                  background: D.gradient, color: "#fff", fontSize: 14, fontWeight: 700,
                  border: "none", cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(124,106,244,0.28)", opacity: loading || otp.length !== 6 ? 0.6 : 1,
                }}>
                  {loading ? <PigeonLoader size="sm" /> : "Verify & continue"}
                </button>
              </Magnetic>

              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, color: D.textDim }}>Didn&apos;t receive it? </span>
                <button onClick={handleResend} disabled={resending} style={{ fontSize: 13, color: D.iris, fontWeight: 600, background: "none", border: "none", cursor: "pointer", opacity: resending ? 0.5 : 1 }}>
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
