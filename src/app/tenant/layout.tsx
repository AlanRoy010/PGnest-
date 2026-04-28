"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, BookOpen, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import PigeonLogo from "@/components/shared/PigeonLogo";

const NAV_ITEMS = [
  { href: "/tenant/search",   label: "Find PGs",    icon: Search },
  { href: "/tenant/bookings", label: "My Bookings", icon: BookOpen },
  { href: "/tenant/deposit",  label: "My Deposit",  icon: Shield },
];

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, email } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    const supabase = createClient();

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "local" }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 3000)
        )
      ]);
    } catch {
      console.log("SignOut timed out, clearing locally");
    }

    setShowSignOutModal(false);
    toast.success("Signed out successfully!");
    window.location.href = "/";
  };

  const Sidebar = () => {
    return (
      <div className="flex flex-col h-full bg-[#FDFBF8] border-r border-[#E2DDD6]">
        <div className="px-6 py-5 border-b border-[#E2DDD6]">
          <Link href="/">
            <PigeonLogo size="md" />
          </Link>
          <div className="mt-1 text-xs text-[#A09488]">Tenant Dashboard</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "nav-item-active text-[#C5522E]"
                    : "text-[#5C5450] hover:bg-[#EDE8E0] hover:text-[#2C3040]"
                }`}
              >
                {active && (
                  <span
                    className="absolute left-3 w-1.5 h-1.5 rounded-full bg-[#E8734A]"
                    style={{ animation: "pigeon-bob 1.5s ease-in-out infinite" }}
                  />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#E8734A]" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#E2DDD6] space-y-1">
          <Link
            href="/tenant/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#EDE8E0] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#FDF0EB] flex items-center justify-center text-xs font-semibold text-[#C5522E]">
              {profile?.full_name
                ? getInitials(profile.full_name)
                : email
                  ? email[0].toUpperCase()
                  : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#2C3040] truncate">
                {profile?.full_name || (email ? email.split("@")[0] : "My Profile")}
              </div>
              <div className="text-xs text-[#A09488] truncate">
                {profile?.phone || email}
              </div>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5C5450] hover:bg-[#EDE8E0] hover:text-[#2C3040] transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 fixed h-screen">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 h-full shadow-xl">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FDFBF8] border-b border-[#E2DDD6]">
          <Link href="/">
            <PigeonLogo size="sm" />
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-[#57534e]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Sign out confirmation modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="feather-card w-full max-w-sm p-6 animate-fade-up shadow-xl">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-display text-lg font-semibold text-[#2C3040] mb-1">
              Sign out?
            </h2>
            <p className="text-sm text-[#7A7A8A] mb-6">
              You&apos;ll need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="feather-btn feather-btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
