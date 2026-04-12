"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";
import { User, Mail, Phone, Shield, Edit2, Save, X, Loader2 } from "lucide-react";
import type { Profile } from "@/types";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile: hookProfile, email: hookEmail, loading } = useUser();

  // Keep a local copy so the page reflects saves immediately without reload
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hookProfile && !localProfile) setLocalProfile(hookProfile);
  }, [hookProfile]);

  useEffect(() => {
    if (hookEmail) setAuthEmail(hookEmail);
  }, [hookEmail]);

  useEffect(() => {
    const p = localProfile || hookProfile;
    if (p) {
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
    }
  }, [localProfile, hookProfile]);

  const profile = localProfile || hookProfile;

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error("Name is required"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); return; }
    setSaving(true);
    const payload = { full_name: fullName.trim(), phone: phone.trim() };
    const { error } = profile
      ? await supabase.from("profiles").update(payload).eq("id", profile.id)
      : await supabase.from("profiles").insert({ id: user.id, ...payload, role: "tenant" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    // Update local copy so UI reflects the change without a reload
    setLocalProfile((prev) => prev
      ? { ...prev, ...payload }
      : { id: user.id, ...payload, role: "tenant", email: authEmail, avatar_url: null, is_verified: false, created_at: "", updated_at: "" }
    );
    toast.success("Profile updated!");
    setEditing(false);
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setEditing(false);
  };

  const displayEmail = profile?.email || authEmail;
  const initial = profile?.full_name
    ? profile.full_name[0].toUpperCase()
    : displayEmail?.[0]?.toUpperCase() || "?";

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-[#1c1917]">My Profile</h1>
        <p className="text-sm text-[#78716c] mt-1">View and manage your account details</p>
      </div>

      {/* Avatar + name */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#fed7aa] flex items-center justify-center text-2xl font-semibold text-[#c2410c] flex-shrink-0">
          {initial}
        </div>
        <div>
          <div className="font-display text-lg font-semibold text-[#1c1917]">
            {profile?.full_name || displayEmail || "—"}
          </div>
          <div className="text-sm text-[#78716c] capitalize mt-0.5">{profile?.role || "tenant"}</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-medium text-[#1c1917]">Account Details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-sm text-[#ea6c0a] hover:text-[#c2410c] font-medium transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#78716c] mb-1.5">
              <User className="w-3.5 h-3.5" /> Full name
            </label>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <div className={readCls}>{profile?.full_name || "—"}</div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#78716c] mb-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone number
            </label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className={inputCls}
              />
            ) : (
              <div className={readCls}>{profile?.phone || "—"}</div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#78716c] mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Email address
            </label>
            <div className={`${readCls} flex items-center justify-between`}>
              <span>{displayEmail || "—"}</span>
              <span className="text-xs text-[#a8a29e] ml-2 flex-shrink-0">Read only</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#78716c] mb-1.5">
              <Shield className="w-3.5 h-3.5" /> Account type
            </label>
            <div className={`${readCls} capitalize`}>{profile?.role || "tenant"}</div>
          </div>
        </div>

        {editing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-[#57534e] border border-[#e7e5e4] rounded-xl hover:bg-[#f5f5f4] transition-colors"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#ea6c0a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Save className="w-4 h-4" /> Save changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]";
const readCls = "text-sm text-[#1c1917] px-3.5 py-2.5 bg-[#fafaf9] rounded-xl";
