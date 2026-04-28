"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Home, Search, ArrowLeft, Mail, Lock, User } from "lucide-react";
import PigeonLogo from "@/components/shared/PigeonLogo";
import PigeonLoader from "@/components/shared/PigeonLoader";

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
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim(), role },
          emailRedirectTo: undefined,
        },
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
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/">
          <PigeonLogo size="md" showTagline />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="feather-card shadow-lg">
            {/* Feather corner decorations */}
            <div className="absolute top-6 right-5 pointer-events-none opacity-10">
              <svg width="20" height="60" viewBox="0 0 20 60" fill="#6B7FA3">
                <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" />
              </svg>
            </div>
            <div className="absolute bottom-8 left-4 pointer-events-none opacity-10 rotate-12">
              <svg width="14" height="42" viewBox="0 0 20 60" fill="#E8734A">
                <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" />
              </svg>
            </div>

            <div className="p-8">
              {step === 1 ? (
                <>
                  <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-1">
                      Create account
                    </h1>
                    <p className="text-sm text-[#7A7A8A]">Join PG Owns in seconds</p>
                  </div>

                  <div className="space-y-4">
                    {/* Role selector */}
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
                            <span className={`text-sm font-medium ${role === value ? "text-[#C5522E]" : "text-[#5C5450]"}`}>
                              {label}
                            </span>
                            <span className="text-[10px] text-[#A09488] leading-tight">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Full name */}
                    <div>
                      <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Full name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
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
                      <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
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
                      <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09488]" />
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
                      className="feather-btn w-full justify-center py-3 mt-2"
                    >
                      {loading ? <PigeonLoader size="sm" /> : "Continue"}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[#7A7A8A] mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors">
                      Sign in
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-8">
                    <button
                      onClick={() => { setStep(1); setOtp(""); }}
                      className="flex items-center gap-1.5 text-sm text-[#7A7A8A] hover:text-[#2C3040] mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="w-12 h-12 bg-[#FDF0EB] rounded-2xl flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-[#E8734A]" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-1">
                      Check your email
                    </h1>
                    <p className="text-sm text-[#7A7A8A]">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-[#2C3040]">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C5450] mb-1.5">
                        Verification code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="w-full border border-[#E2DDD6] rounded-xl px-4 py-3.5 text-2xl font-semibold tracking-[0.5em] text-center outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#C4BAB0] placeholder:tracking-[0.5em]"
                        onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
                      />
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={loading || otp.length !== 6}
                      className="feather-btn w-full justify-center py-3"
                    >
                      {loading ? <PigeonLoader size="sm" /> : "Verify & continue"}
                    </button>

                    <div className="text-center">
                      <span className="text-xs text-[#7A7A8A]">Didn&apos;t receive it? </span>
                      <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-xs text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors disabled:opacity-50"
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
    </div>
  );
}

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
