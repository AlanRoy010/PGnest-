"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Home, User } from "lucide-react";
import type { UserRole } from "@/types";
import { Suspense } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>(
    (searchParams.get("role") as UserRole) || "tenant"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim()) { toast.error("Enter your full name"); return; }
    if (!email.trim()) { toast.error("Enter your email address"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim(), role },
      },
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    toast.success("Account created! Signing you in...");
    router.push(role === "owner" ? "/owner/listings" : "/tenant/search");
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <nav className="px-6 py-4">
        <Link href="/" className="font-display text-2xl font-semibold text-[#1c1917]">
          PG<span className="text-[#ea6c0a]">Nest</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="font-display text-2xl font-semibold text-[#1c1917] mb-1">
                Create your account
              </h1>
              <p className="text-sm text-[#78716c]">
                Join thousands finding their perfect PG
              </p>
            </div>

            <div className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-2">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "tenant" as UserRole, label: "Looking for PG", icon: User },
                    { value: "owner" as UserRole, label: "PG Owner", icon: Home },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        role === r.value
                          ? "border-[#ea6c0a] bg-[#fff7ed] text-[#c2410c]"
                          : "border-[#e7e5e4] text-[#78716c] hover:border-[#d6d3d1]"
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full border border-[#e7e5e4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]"
                />
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-[#e7e5e4] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]"
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                />
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#ea6c0a] text-white py-3 rounded-xl font-medium text-sm hover:bg-[#c2410c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Create account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-xs text-[#a8a29e] text-center">
                By signing up, you agree to our Terms of Service.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[#f5f5f4] text-center">
              <p className="text-sm text-[#78716c]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#ea6c0a] font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}