"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Home, BookOpen, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalBookings: 0,
    activeBookings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [users, listings, bookings, activeBookings] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("listings").select("id", { count: "exact" }),
        supabase.from("bookings").select("id", { count: "exact" }),
        supabase.from("bookings").select("id", { count: "exact" }).eq("status", "active"),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalListings: listings.count || 0,
        totalBookings: bookings.count || 0,
        activeBookings: activeBookings.count || 0,
      });
    };

    fetchStats();
  }, [supabase]);

  const cards = [
    { label: "Total Users",      value: stats.totalUsers,    icon: Users,      color: "bg-blue-50 text-blue-600" },
    { label: "Total Listings",   value: stats.totalListings, icon: Home,       color: "bg-[#fff7ed] text-[#ea6c0a]" },
    { label: "Total Bookings",   value: stats.totalBookings, icon: BookOpen,   color: "bg-purple-50 text-purple-600" },
    { label: "Active Bookings",  value: stats.activeBookings,icon: TrendingUp, color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">
          Dashboard
        </h1>
        <p className="text-sm text-[#78716c] mt-0.5">
          Welcome back, here&apos;s what&apos;s happening on PGNest
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-[#e7e5e4] rounded-2xl p-5"
          >
            <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="font-display text-2xl font-semibold text-[#1c1917]">
              {card.value}
            </div>
            <div className="text-xs text-[#78716c] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}