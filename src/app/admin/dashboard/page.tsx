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
      try {
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
      } catch {
        // stats stay at 0 on error
      }
    };
    fetchStats();
  }, [supabase]);

  const cards = [
    { label: "Total Users",     value: stats.totalUsers,     icon: Users,      color: "#6B7FA3", bg: "#EDF0F6" },
    { label: "Total Listings",  value: stats.totalListings,  icon: Home,       color: "#E8734A", bg: "#FDF0EB" },
    { label: "Total Bookings",  value: stats.totalBookings,  icon: BookOpen,   color: "#7C6E9E", bg: "#F0EDF8" },
    { label: "Active Bookings", value: stats.activeBookings, icon: TrendingUp, color: "#5A8C6A", bg: "#EDF5F0" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[#2C3040]">
          Dashboard
        </h1>
        <p className="text-sm text-[#7A7A8A] mt-0.5">
          Welcome back — here&apos;s what&apos;s happening on PG Owns
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="pg-card feather-card p-5"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: card.bg }}
            >
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <div className="font-display text-2xl font-bold text-[#2C3040]">
              {card.value}
            </div>
            <div className="text-xs text-[#7A7A8A] mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
