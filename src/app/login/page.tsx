"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

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

    if (profile?.role === "admin") {
      router.push("/admin/dashboard");
    } else if (profile?.role === "owner") {
      router.push("/owner/listings");
    } else {
      router.push("/tenant/search");
    }
  };
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/" className="font-display text-2xl font-semibold text-[#1c1917]">
          <Image src="/logo.svg" alt="PGOwns" width={32} height={32} /><span className="font-display font-black">Owns</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-semibold text-[#1c1917] mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-[#78716c]">
                Sign in to your account
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full border border-[#e7e5e4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full border border-[#e7e5e4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !email.trim() || !password}
                className="w-full flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#c2410c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Sign in <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#f5f5f4] text-center">
              <p className="text-sm text-[#78716c]">
                New to PG Owns?{" "}
                <Link href="/signup" className="text-[#ea6c0a] font-medium hover:underline">
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
