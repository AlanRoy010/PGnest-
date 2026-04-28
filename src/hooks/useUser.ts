"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function useUser() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange fires INITIAL_SESSION immediately with the current
    // session — no need for a separate getUser() call that causes a duplicate
    // profile fetch on every mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          if (mounted) { setProfile(null); setEmail(""); setLoading(false); }
          return;
        }

        if (mounted) setEmail(session.user.email || "");

        // Skip profile re-fetch on token refresh — profile hasn't changed.
        if (event === "TOKEN_REFRESHED") {
          if (mounted) setLoading(false);
          return;
        }

        try {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (mounted) setProfile(data);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    profile,
    email,
    loading,
    isOwner: profile?.role === "owner",
    isTenant: profile?.role === "tenant",
    isAdmin: profile?.role === "admin",
  };
}
