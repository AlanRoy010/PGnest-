"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Home, Search, ArrowLeft, Mail, Lock, User } from "lucide-react";
import Image from "next/image";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

type Role = "tenant" | "owner";

// Floating feather positions for left panel (offset from login page)
const PANEL_FEATHERS = [
  { top: "8%",  left: "12%",  size: 44, color: "#fff",    opacity: 0.5,  delay: "0.5s", dur: "9s"  },
  { top: "52%", left: "62%",  size: 32, color: "#C4BADB", opacity: 0.65, delay: "0s",   dur: "11s" },
  { top: "75%", left: "10%",  size: 24, color: "#B8C4D8", opacity: 0.55, delay: "2s",   dur: "8s"  },
  { top: "32%", right: "8%",  size: 48, color: "#F5C4B0", opacity: 0.45, delay: "1s",   dur: "10s" },
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
        email,
        password,
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

      const redirect = typeof window !== "undefined"
        ? localStorage.getItem("redirect_after_auth")
        : null;
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
    <div className="min-h-screen flex">
      {/* ── Left panel ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-br from-[#364466] to-[#6B7FA3] overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 55% at 60% 35%, rgba(232,115,74,0.18), transparent)" }} />

        {PANEL_FEATHERS.map((f, i) => (
          <div key={i} className="absolute pointer-events-none animate-feather-float"
            style={{
              top: f.top,
              left: "left" in f ? (f as { left: string }).left : undefined,
              right: "right" in f ? (f as { right: string }).right : undefined,
              animationDelay: f.delay,
              animationDuration: f.dur,
              opacity: f.opacity,
            }}>
            <svg width={f.size} height={f.size * 3} viewBox="0 0 20 60" fill={f.color}>
              <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" opacity="0.85"/>
              <path d="M10,8 L10,52" stroke={f.color} strokeWidth="0.7" opacity="0.45" fill="none"/>
              {[14,22,32,42].map(y => (
                <g key={y} stroke={f.color} strokeWidth="0.4" opacity="0.4" fill="none">
                  <path d={`M10 ${y} Q ${10-y/9} ${y+2}, ${10-y/4.5} ${y+4}`}/>
                  <path d={`M10 ${y} Q ${10+y/9} ${y+2}, ${10+y/4.5} ${y+4}`}/>
                </g>
              ))}
            </svg>
          </div>
        ))}

        <div className="relative z-10 max-w-xs text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <Image src="/logo.svg" alt="PG Owns" width={44} height={44} className="brightness-0 invert" />
            <span className="font-display text-2xl font-black text-white tracking-tight">PG <em className="italic font-normal">Owns</em></span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white leading-[1.1] mb-4">
            Open the door.<br/>
            <em className="italic font-normal" style={{ color: "#F5C4B0" }}>The flock will come.</em>
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Join thousands of tenants and owners building a better PG experience across Mumbai.
          </p>

          <div className="mt-10 flex justify-center gap-6">
            {[["₹0", "Platform fee"], ["24h", "Fast approval"], ["100%", "Transparent"]].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="font-display text-xl font-black text-white">{n}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F7F4EF]">
        <nav className="lg:hidden px-6 py-4 border-b border-[#E2DDD6] bg-[#FDFBF8]">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PG Owns" width={36} height={36} />
            <span className="font-display text-lg font-black text-[#2C3040]">PG <em className="italic font-normal">Owns</em></span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#A09488] hover:text-[#5C5450] transition-colors mb-8">
              ← Back to home
            </Link>

            {step === 1 ? (
              <>
                <div className="mb-8">
                  <p className="text-[10px] font-bold text-[#E8734A] uppercase tracking-[0.2em] mb-2">Join PG Owns</p>
                  <h1 className="font-display text-3xl font-bold text-[#2C3040] leading-tight">
                    Find your <em className="italic font-normal text-[#6B7FA3]">perfect nest</em>.
                  </h1>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5450] mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: "tenant", label: "Tenant", sub: "Looking for a PG", icon: Search },
                        { value: "owner",  label: "Owner",  sub: "Listing my PG",    icon: Home  },
                      ] as const).map(({ value, label, sub, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all text-center ${
                            role === value
                              ? "border-[#E8734A] bg-[#FDF0EB]"
                              : "border-[#E2DDD6] hover:border-[#B8C4D8]"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${role === value ? "text-[#E8734A]" : "text-[#A09488]"}`} />
                          <span className={`text-sm font-medium ${role === value ? "text-[#C5522E]" : "text-[#5C5450]"}`}>{label}</span>
                          <span className="text-[10px] text-[#A09488] leading-tight">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name" className={inputCls} style={{ paddingLeft: "2.5rem" }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com" className={inputCls} style={{ paddingLeft: "2.5rem" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters" className={inputCls} style={{ paddingLeft: "2.5rem" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }} />
                    </div>
                  </div>

                  <Magnetic strength={0.15} style={{ display: "block" }}>
                    <button onClick={handleSignUp} disabled={loading} className="feather-btn w-full justify-center py-3 mt-2">
                      {loading ? <PigeonLoader size="sm" /> : "Continue →"}
                    </button>
                  </Magnetic>
                </div>

                <p className="text-center text-xs text-[#7A7A8A] mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors">Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <button onClick={() => { setStep(1); setOtp(""); }}
                    className="flex items-center gap-1.5 text-sm text-[#7A7A8A] hover:text-[#2C3040] mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="w-12 h-12 bg-[#FDF0EB] rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-[#E8734A]" />
                  </div>
                  <p className="text-[10px] font-bold text-[#E8734A] uppercase tracking-[0.2em] mb-2">Almost there</p>
                  <h1 className="font-display text-3xl font-bold text-[#2C3040] leading-tight mb-2">
                    Check your <em className="italic font-normal text-[#6B7FA3]">inbox</em>.
                  </h1>
                  <p className="text-sm text-[#7A7A8A]">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-[#2C3040]">{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Verification code</label>
                    <input
                      type="text" inputMode="numeric" maxLength={6} value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full border border-[#E2DDD6] rounded-xl px-4 py-3.5 text-2xl font-semibold tracking-[0.5em] text-center outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#C4BAB0] placeholder:tracking-[0.5em]"
                      onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                    />
                  </div>

                  <Magnetic strength={0.15} style={{ display: "block" }}>
                    <button onClick={handleVerify} disabled={loading || otp.length !== 6}
                      className="feather-btn w-full justify-center py-3">
                      {loading ? <PigeonLoader size="sm" /> : "Verify & continue"}
                    </button>
                  </Magnetic>

                  <div className="text-center">
                    <span className="text-xs text-[#7A7A8A]">Didn&apos;t receive it? </span>
                    <button onClick={handleResend} disabled={resending}
                      className="text-xs text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors disabled:opacity-50">
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

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
