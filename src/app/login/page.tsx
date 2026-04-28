"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import PigeonLogo from "@/components/shared/PigeonLogo";
import PigeonLoader from "@/components/shared/PigeonLoader";

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    toast.success("Welcome back!");

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
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/">
          <PigeonLogo size="md" showTagline />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Card with gradient header bar */}
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
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-1">
                  Welcome back
                </h1>
                <p className="text-sm text-[#7A7A8A]">
                  Sign in to your account
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5C5450] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5450] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !email.trim() || !password}
                  className="feather-btn w-full justify-center py-3 mt-2"
                >
                  {loading ? (
                    <PigeonLoader size="sm" />
                  ) : (
                    <>Sign in <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
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
    </div>
  );
}

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
