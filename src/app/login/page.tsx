"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import PigeonLoader from "@/components/shared/PigeonLoader";
import { Magnetic } from "@/components/FeatherFX";

// Floating feather positions for left panel
const PANEL_FEATHERS = [
  { top: "12%", left: "8%",  size: 52, color: "#fff",    opacity: 0.55, delay: "0s",   dur: "8s"  },
  { top: "48%", left: "58%", size: 36, color: "#F5C4B0", opacity: 0.70, delay: "1.4s", dur: "10s" },
  { top: "72%", left: "14%", size: 28, color: "#B8C4D8", opacity: 0.60, delay: "0.6s", dur: "12s" },
  { top: "28%", right: "10%", size: 44, color: "#C4BADB", opacity: 0.50, delay: "2s",   dur: "9s"  },
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
    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (profile?.role === "owner") {
      router.push("/owner/listings");
    } else {
      router.push("/tenant/search");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — wing-dark with animated feathers ─── */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-gradient-to-br from-[#2C3040] to-[#4A5A7A] overflow-hidden flex-col items-center justify-center p-12">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 40% 40%, rgba(124,110,158,0.22), transparent)" }} />

        {/* Animated floating feathers */}
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

        {/* Brand content */}
        <div className="relative z-10 max-w-xs text-center">
          <div className="flex items-center justify-center gap-3 mb-10">
            <Image src="/logo.svg" alt="PG Owns" width={44} height={44} className="brightness-0 invert" />
            <span className="font-display text-2xl font-black text-white tracking-tight">PG <em className="italic font-normal">Owns</em></span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white leading-[1.1] mb-4">
            Every flight starts with{" "}
            <em className="italic font-normal" style={{ color: "#F5C4B0" }}>one feather</em>.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Sign in to access your roost, manage your deposit, and find your next nest in Mumbai.
          </p>

          <div className="mt-10 flex justify-center gap-6 text-center">
            {[["1,200+", "Verified PGs"], ["8,400+", "Happy tenants"], ["₹0", "Hidden fees"]].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-xl font-black text-white">{n}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F7F4EF]">
        {/* Mobile nav */}
        <nav className="lg:hidden px-6 py-4 border-b border-[#E2DDD6] bg-[#FDFBF8]">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PG Owns" width={36} height={36} />
            <span className="font-display text-lg font-black text-[#2C3040]">PG <em className="italic font-normal">Owns</em></span>
          </Link>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Back to home — desktop only */}
            <Link href="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#A09488] hover:text-[#5C5450] transition-colors mb-8">
              ← Back to home
            </Link>

            <div className="mb-8">
              <p className="text-[10px] font-bold text-[#E8734A] uppercase tracking-[0.2em] mb-2">Welcome back</p>
              <h1 className="font-display text-3xl font-bold text-[#2C3040] leading-tight">
                Land into <em className="italic font-normal text-[#6B7FA3]">your nest</em>.
              </h1>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5C5450] mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#5C5450]">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[#E8734A] hover:text-[#C5522E] transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={inputCls}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <Magnetic strength={0.15} style={{ display: "block" }}>
                <button
                  onClick={handleLogin}
                  disabled={loading || !email.trim() || !password}
                  className="feather-btn w-full justify-center py-3 mt-2"
                >
                  {loading ? <PigeonLoader size="sm" /> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
                </button>
              </Magnetic>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E2DDD6] text-center">
              <p className="text-sm text-[#7A7A8A]">
                New to PG Owns?{" "}
                <Link href="/signup" className="text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
