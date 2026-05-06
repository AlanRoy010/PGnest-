"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import PigeonLogo from "@/components/shared/PigeonLogo";
import PigeonLoader from "@/components/shared/PigeonLoader";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password) { toast.error("Enter a new password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { toast.error(error.message); return; }

    toast.success("Password updated! Please sign in.");
    router.push("/login");
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
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold text-[#2C3040] mb-1">
                  Set new password
                </h1>
                <p className="text-sm text-[#7A7A8A]">
                  Choose a strong password for your account.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5C5450] mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5C5450] mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className={inputCls}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  />
                </div>

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirm}
                  className="feather-btn w-full justify-center py-3 mt-2"
                >
                  {loading ? (
                    <PigeonLoader size="sm" />
                  ) : (
                    <>Update password <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-[#E2DDD6] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E8734A] focus:ring-2 focus:ring-[#E8734A]/20 transition-all bg-[#FDFBF8] text-[#2C3040] placeholder:text-[#A09488]";
