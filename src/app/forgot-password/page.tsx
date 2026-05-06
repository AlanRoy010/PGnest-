"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, ArrowLeft, Mail } from "lucide-react";
import PigeonLogo from "@/components/shared/PigeonLogo";
import PigeonLoader from "@/components/shared/PigeonLoader";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { toast.error("Enter your email"); return; }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    setSent(true);
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
              {sent ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-[#FDF0EB] flex items-center justify-center mx-auto mb-5">
                    <Mail className="w-7 h-7 text-[#E8734A]" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-2">
                    Check your inbox
                  </h1>
                  <p className="text-sm text-[#7A7A8A] mb-6">
                    We sent a reset link to <span className="font-medium text-[#2C3040]">{email}</span>. It expires in 1 hour.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-[#E8734A] font-semibold hover:text-[#C5522E] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-1">
                      Reset password
                    </h1>
                    <p className="text-sm text-[#7A7A8A]">
                      Enter your email and we&apos;ll send you a reset link.
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
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        autoFocus
                      />
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={loading || !email.trim()}
                      className="feather-btn w-full justify-center py-3 mt-2"
                    >
                      {loading ? (
                        <PigeonLoader size="sm" />
                      ) : (
                        <>Send reset link <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#E2DDD6] text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-sm text-[#7A7A8A] hover:text-[#2C3040] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                    </Link>
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

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
