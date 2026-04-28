"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, BookOpen, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
const NAV_ITEMS = [
  { href: "/admin/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/listings",     label: "Listings",     icon: Home },
  { href: "/admin/reservations", label: "Reservations", icon: BookOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, email } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => setShowSignOutModal(true);

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
      console.log("SignOut timed out");
    }
    setShowSignOutModal(false);
    toast.success("Signed out successfully!");
    window.location.href = "/";
  };

  const Sidebar = () => {
    return (
      <div className="flex flex-col h-full bg-[#364466] border-r border-[#243052]">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#243052]">
          <Link href="/">
            {/* On dark bg, override text colors with inline styles */}
            <div className="flex items-center gap-2 select-none cursor-pointer">
              <div style={{ animation: "pigeon-bob 3s ease-in-out infinite" }}>
                <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                  <ellipse cx="32" cy="38" rx="18" ry="14" fill="#B8C4D8" />
                  <ellipse cx="28" cy="40" rx="12" ry="8" fill="#6B7FA3" opacity="0.6" />
                  <ellipse cx="36" cy="42" rx="10" ry="8" fill="white" opacity="0.15" />
                  <circle cx="40" cy="22" r="11" fill="#B8C4D8" />
                  <ellipse cx="36" cy="30" rx="5" ry="4" fill="#7C6E9E" opacity="0.5" />
                  <circle cx="43" cy="20" r="2.5" fill="#2C3040" />
                  <circle cx="43.8" cy="19.2" r="0.8" fill="white" />
                  <path d="M50 22 L56 21 L50 24 Z" fill="#E8734A" />
                  <path d="M14 42 L8 50 L16 46 L12 54 L20 48 Z" fill="#6B7FA3" opacity="0.8" />
                </svg>
              </div>
              <div className="font-display font-bold text-lg leading-none">
                <span style={{ color: "#95A8C4" }}>PG</span>
                <span style={{ color: "#E8734A" }}>Owns</span>
              </div>
            </div>
          </Link>
          <div className="mt-1 text-xs text-[#95A8C4]">Admin Panel</div>
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
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#E8734A] text-white"
                    : "text-[#B8C4D8] hover:bg-[#243052] hover:text-white"
                }`}
              >
                {active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"
                    style={{ animation: "pigeon-bob 1.5s ease-in-out infinite" }}
                  />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile + signout */}
        <div className="px-3 py-4 border-t border-[#243052] space-y-1">
          <Link
            href="/admin/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#243052] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#E8734A] flex items-center justify-center text-xs font-semibold text-white">
              {profile?.full_name
                ? getInitials(profile.full_name)
                : email
                  ? email[0].toUpperCase()
                  : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {profile?.full_name || (email ? email.split("@")[0] : "Admin")}
              </div>
              <div className="text-xs text-[#95A8C4]">Administrator</div>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#B8C4D8] hover:bg-[#243052] hover:text-white transition-all w-full"
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
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#364466] border-b border-[#243052]">
          <Link href="/">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                <ellipse cx="32" cy="38" rx="18" ry="14" fill="#B8C4D8" />
                <circle cx="40" cy="22" r="11" fill="#B8C4D8" />
                <path d="M50 22 L56 21 L50 24 Z" fill="#E8734A" />
              </svg>
              <span className="font-display font-bold text-base">
                <span style={{ color: "#95A8C4" }}>PG</span>
                <span style={{ color: "#E8734A" }}>Owns</span>
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(true)} className="p-2 text-[#B8C4D8]">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* Sign out modal */}
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
              You&apos;ll need to sign in again to access the admin panel.
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
