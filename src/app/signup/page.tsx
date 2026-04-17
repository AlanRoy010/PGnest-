"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Home, Search, ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";

type Role = "tenant" | "owner";

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
      // Create the Supabase auth user (email confirm disabled in dashboard)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), role },
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) { toast.error(signUpError.message); return; }

      // Send our custom OTP via Resend
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
      // Verify OTP against our table
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await res.json();

      if (!result.success) { toast.error(result.error || "Invalid or expired OTP"); return; }

      // OTP valid — sign them in
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { toast.error(signInError.message); return; }

      toast.success("Email verified! Welcome aboard.");
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
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4">
        <Link href="/" className="font-display text-2xl font-semibold text-[#1c1917]">
          <Image src="/logo.svg" alt="PGOwns" width={32} height={32} /><span className="font-display font-black">Owns</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-8 shadow-sm">

            {step === 1 ? (
              <>
                <div className="mb-8">
                  <h1 className="font-display text-2xl font-semibold text-[#1c1917] mb-1">
                    Create account
                  </h1>
                  <p className="text-sm text-[#78716c]">Join PG Owns in seconds</p>
                </div>

                <div className="space-y-4">
                  {/* Role selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-2">I am a</label>
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
                              ? "border-[#ea6c0a] bg-[#fff7ed]"
                              : "border-[#e7e5e4] hover:border-[#a8a29e]"
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${role === value ? "text-[#ea6c0a]" : "text-[#a8a29e]"}`} />
                          <span className={`text-sm font-medium ${role === value ? "text-[#c2410c]" : "text-[#57534e]"}`}>
                            {label}
                          </span>
                          <span className="text-[10px] text-[#a8a29e] leading-tight">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full name */}
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className={inputCls}
                        style={{ paddingLeft: "2.5rem" }}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputCls}
                        style={{ paddingLeft: "2.5rem" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a29e]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className={inputCls}
                        style={{ paddingLeft: "2.5rem" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSignUp(); }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                  </button>
                </div>

                <p className="text-center text-xs text-[#78716c] mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#ea6c0a] font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <button
                    onClick={() => { setStep(1); setOtp(""); }}
                    className="flex items-center gap-1.5 text-sm text-[#78716c] hover:text-[#1c1917] mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="w-12 h-12 bg-[#fff7ed] rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-[#ea6c0a]" />
                  </div>
                  <h1 className="font-display text-2xl font-semibold text-[#1c1917] mb-1">
                    Check your email
                  </h1>
                  <p className="text-sm text-[#78716c]">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-[#1c1917]">{email}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                      Verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full border border-[#e7e5e4] rounded-xl px-4 py-3.5 text-2xl font-semibold tracking-[0.5em] text-center outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#d6d3d1] placeholder:tracking-[0.5em]"
                      onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                    />
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & continue"}
                  </button>

                  <div className="text-center">
                    <span className="text-xs text-[#78716c]">Didn&apos;t receive it? </span>
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs text-[#ea6c0a] font-medium hover:underline disabled:opacity-50"
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

const inputCls = "w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]";
