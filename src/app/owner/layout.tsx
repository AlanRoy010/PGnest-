"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/owner/listings", label: "My Listings", icon: Home },
  { href: "/owner/bookings", label: "Bookings",    icon: BookOpen },
  { href: "/owner/deposit",  label: "Deposits",    icon: Shield },
];

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useUser();
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
        ),
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
      <div className="flex flex-col h-full bg-white border-r border-[#e7e5e4]">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#e7e5e4]">
          <Link href="/" className="font-display text-xl font-semibold text-[#1c1917]">
            PG<span className="text-[#ea6c0a]">Nest</span>
          </Link>
          <div className="mt-0.5 text-xs text-[#a8a29e]">Owner Dashboard</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#fff7ed] text-[#c2410c]"
                    : "text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#1c1917]"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile + signout */}
        <div className="px-3 py-4 border-t border-[#e7e5e4] space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#fed7aa] flex items-center justify-center text-xs font-semibold text-[#c2410c]">
              {profile ? getInitials(profile.full_name) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#1c1917] truncate">
                {profile?.full_name}
              </div>
              <div className="text-xs text-[#a8a29e] truncate">
                {profile?.phone}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#1c1917] transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-56 flex-shrink-0 fixed h-screen">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
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
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e7e5e4]">
          <Link
            href="/"
            className="font-display text-lg font-semibold text-[#1c1917]"
          >
            PG<span className="text-[#ea6c0a]">Nest</span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="font-display text-lg font-semibold text-[#1c1917] mb-1">
              Sign out?
            </h2>
            <p className="text-sm text-[#78716c] mb-6">
              You&apos;ll need to sign in again to access your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-[#57534e] border border-[#e7e5e4] rounded-xl hover:bg-[#f5f5f4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSignOut}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
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