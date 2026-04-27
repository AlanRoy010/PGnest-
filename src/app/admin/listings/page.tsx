"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  formatCurrency,
  AMENITY_LABELS,
  AREAS_MUMBAI,
  AMENITIES_LIST,
} from "@/lib/utils";
import {
  Plus, Edit2, Trash2, Eye, EyeOff,
  Loader2, Home, Users, MapPin, X,
  ImagePlus, XCircle, Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { Listing, CreateListingForm, Gender } from "@/types";

// ─── Shared constants ─────────────────────────────────────────────────────────

const SHARING_LABELS: Record<number, string> = {
  1: "Single Room", 2: "Double Sharing", 3: "Triple Sharing",
  4: "4-Sharing", 5: "5-Sharing", 6: "6-Sharing",
};

const FLOOR_LABELS = [
  "Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor",
  "Fifth Floor", "Sixth Floor", "Seventh Floor", "Eighth Floor", "Ninth Floor", "Tenth Floor",
];

const floorPrefix = (n: number) => n === 0 ? "G" : `${n}F`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Floor {
  id: string;
  floor_number: number;
  floor_label: string;
}

interface SharingTypeWithCounts {
  id: string;
  floor_id: string;
  sharing_type: number;
  rent_per_person: number;
  total_rooms: number;
  beds_per_room: number;
  is_active: boolean;
  total_beds: number;
  available_beds: number;
}

interface RawSharingType {
  id: string;
  floor_id: string;
  sharing_type: number;
  rent_per_person: number;
  total_rooms: number;
  beds_per_room: number;
  is_active: boolean;
  beds: { id: string; status: string }[];
}

// ─── Listing form default ─────────────────────────────────────────────────────

const BLANK_FORM: CreateListingForm = {
  title: "", description: "", address: "", area: "", pincode: "",
  monthly_rent: 0, security_deposit: 0, rooms_available: 1, total_rooms: 1, beds_per_room: 1,
  gender_preference: "any", furnishing: "furnished", room_type: "single",
  amenities: [], rules: [],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminListingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { loading: userLoading } = useUser();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateListingForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [ruleInput, setRuleInput] = useState("");

  const [managingListing, setManagingListing] = useState<Listing | null>(null);

  // Image upload state
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!userLoading) fetchListings();
  }, [userLoading, fetchListings]);

  const openCreate = () => {
    setForm(BLANK_FORM);
    setPhotos([]);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (l: Listing) => {
    setForm({
      title: l.title, description: l.description, address: l.address,
      area: l.area, pincode: l.pincode, monthly_rent: l.monthly_rent,
      security_deposit: l.security_deposit, rooms_available: l.rooms_available,
      total_rooms: l.total_rooms, beds_per_room: 1, gender_preference: l.gender_preference,
      furnishing: l.furnishing, room_type: l.room_type,
      amenities: l.amenities, rules: l.rules,
    });
    setPhotos(l.photos || []);
    setEditingId(l.id);
    setShowForm(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    const remaining = 3 - photos.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploadingPhoto(true);

    for (const file of filesToUpload) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per image`);
        continue;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error } = await supabase.storage
        .from("listing-photos")
        .upload(filePath, file);

      if (error) { toast.error(`Failed to upload ${file.name}`); continue; }

      const { data: { publicUrl } } = supabase.storage
        .from("listing-photos")
        .getPublicUrl(filePath);

      setPhotos((prev) => [...prev, publicUrl]);
    }

    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = async (url: string, index: number) => {
    try {
      const path = url.split("/listing-photos/")[1];
      if (path) {
        await supabase.storage.from("listing-photos").remove([`listings/${path.split("listings/")[1]}`]);
      }
    } catch {
      // ignore storage deletion errors
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const saveListing = async () => {
    if (!form.title || !form.area || !form.monthly_rent) {
      toast.error("Fill in title, area, and monthly rent");
      return;
    }
    setSaving(true);

    const listingData = { ...form, photos };

    if (editingId) {
      const { error } = await supabase.from("listings").update(listingData).eq("id", editingId);
      if (error) { toast.error("Failed to update listing"); }
      else { toast.success("Listing updated"); fetchListings(); setShowForm(false); }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); setSaving(false); return; }
      const { error } = await supabase.from("listings").insert({ ...listingData, owner_id: user.id });
      if (error) { toast.error("Failed to create listing: " + error.message); }
      else { toast.success("Listing created!"); fetchListings(); setShowForm(false); }
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("listings").update({ is_active: !current }).eq("id", id);
    setListings(listings.map((l) => l.id === id ? { ...l, is_active: !current } : l));
    toast.success(!current ? "Listing published" : "Listing hidden");
  };

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) { toast.error("Cannot delete — it may have active bookings"); }
    else { setListings(listings.filter((l) => l.id !== id)); toast.success("Listing deleted"); }
  };

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  const addRule = () => {
    if (!ruleInput.trim()) return;
    setForm((f) => ({ ...f, rules: [...f.rules, ruleInput.trim()] }));
    setRuleInput("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-[#ea6c0a]" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1c1917]">All Listings</h1>
          <p className="text-sm text-[#78716c] mt-0.5">
            {listings.length} listing{listings.length !== 1 ? "s" : ""} on the platform
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#ea6c0a] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors"
        >
          <Plus className="w-4 h-4" /> New listing
        </button>
      </div>

      {/* Empty state */}
      {listings.length === 0 && !showForm && (
        <div className="text-center py-20 bg-white border border-[#e7e5e4] rounded-2xl">
          <Home className="w-10 h-10 text-[#d6d3d1] mx-auto mb-4" />
          <h3 className="font-display font-semibold text-[#1c1917] mb-1">No listings yet</h3>
          <p className="text-sm text-[#78716c] mb-6">Create the first listing for the platform</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-[#ea6c0a] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors">
            <Plus className="w-4 h-4" /> Create listing
          </button>
        </div>
      )}

      {/* Listings */}
      {listings.length > 0 && (
        <div className="space-y-4 mb-8 stagger">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white border border-[#e7e5e4] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#fed7aa] to-[#fdba74] flex-shrink-0 overflow-hidden">
                {listing.photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.photos[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-[#1c1917] truncate">{listing.title}</h3>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    listing.is_active ? "bg-green-50 text-green-700" : "bg-[#f5f5f4] text-[#78716c]"
                  }`}>
                    {listing.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#a8a29e] mt-0.5">
                  <MapPin className="w-3 h-3" /> {listing.area}
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-semibold text-[#1c1917]">
                    {formatCurrency(listing.monthly_rent)}
                    <span className="font-normal text-[#78716c]">/mo</span>
                  </span>
                  <span className="text-xs text-[#78716c] flex items-center gap-1">
                    <Users className="w-3 h-3" /> {listing.rooms_available}/{listing.total_rooms} rooms
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setManagingListing(listing)}
                  className="p-2 text-[#a8a29e] hover:text-[#57534e] hover:bg-[#f5f5f4] rounded-lg transition-all"
                  title="Manage floors & beds"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActive(listing.id, listing.is_active)}
                  className="p-2 text-[#a8a29e] hover:text-[#57534e] hover:bg-[#f5f5f4] rounded-lg transition-all"
                  title={listing.is_active ? "Hide" : "Publish"}>
                  {listing.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(listing)}
                  className="p-2 text-[#a8a29e] hover:text-[#57534e] hover:bg-[#f5f5f4] rounded-lg transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteListing(listing.id)}
                  className="p-2 text-[#a8a29e] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floors & Beds Modal */}
      {managingListing && (
        <FloorsBedModal
          listing={managingListing}
          onClose={() => setManagingListing(null)}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#e7e5e4]">
              <h2 className="font-display text-xl font-semibold text-[#1c1917]">
                {editingId ? "Edit listing" : "New listing"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-[#a8a29e] hover:text-[#1c1917] rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo Upload */}
              <Field label={`Photos (${photos.length}/3 — max 3, 5MB each)`}>
                <div className="space-y-3">
                  {photos.length > 0 && (
                    <div className="flex gap-3">
                      {photos.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#e7e5e4] flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePhoto(url, i)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full p-0.5 transition-colors">
                            <XCircle className="w-4 h-4 text-white" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md">Cover</span>
                          )}
                        </div>
                      ))}
                      {photos.length < 3 && (
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="w-24 h-24 rounded-xl border-2 border-dashed border-[#e7e5e4] flex flex-col items-center justify-center gap-1 text-[#a8a29e] hover:border-[#ea6c0a] hover:text-[#ea6c0a] transition-all flex-shrink-0">
                          {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[10px] font-medium">Add photo</span></>}
                        </button>
                      )}
                    </div>
                  )}

                  {photos.length === 0 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-[#e7e5e4] flex flex-col items-center justify-center gap-2 text-[#a8a29e] hover:border-[#ea6c0a] hover:text-[#ea6c0a] transition-all">
                      {uploadingPhoto
                        ? <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Uploading...</span></>
                        : <><ImagePlus className="w-6 h-6" /><span className="text-sm font-medium">Click to upload photos</span><span className="text-xs">PNG, JPG up to 5MB · Max 3 photos</span></>}
                    </button>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </div>
              </Field>

              <Field label="Listing title *">
                <input className={inputCls} value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Furnished Single Room in Andheri West" />
              </Field>

              <Field label="Description *">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your PG — location highlights, what's special, nearby landmarks..." />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Area *">
                  <select className={inputCls} value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}>
                    <option value="">Select area</option>
                    {AREAS_MUMBAI.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
                <Field label="Pincode *">
                  <input className={inputCls} value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.slice(0, 6) })}
                    placeholder="400053" />
                </Field>
              </div>

              <Field label="Full address">
                <input className={inputCls} value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Building name, street, landmark" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly rent (₹) *">
                  <input type="number" className={inputCls} value={form.monthly_rent || ""}
                    onChange={(e) => setForm({ ...form, monthly_rent: Number(e.target.value) })}
                    placeholder="12000" />
                </Field>
                <Field label="Security deposit (₹) *">
                  <input type="number" className={inputCls} value={form.security_deposit || ""}
                    onChange={(e) => setForm({ ...form, security_deposit: Number(e.target.value) })}
                    placeholder="24000" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Rooms available">
                  <input type="number" className={inputCls} min={0} value={form.rooms_available}
                    onChange={(e) => setForm({ ...form, rooms_available: Number(e.target.value) })} />
                </Field>
                <Field label="Total rooms">
                  <input type="number" className={inputCls} min={1} value={form.total_rooms}
                    onChange={(e) => setForm({ ...form, total_rooms: Number(e.target.value) })} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Gender preference">
                  <select className={inputCls} value={form.gender_preference}
                    onChange={(e) => setForm({ ...form, gender_preference: e.target.value as Gender })}>
                    <option value="any">Any</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                </Field>
                <Field label="Furnishing">
                  <select className={inputCls} value={form.furnishing}
                    onChange={(e) => setForm({ ...form, furnishing: e.target.value as Listing["furnishing"] })}>
                    <option value="furnished">Furnished</option>
                    <option value="semi-furnished">Semi-furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </Field>
                <Field label="Room type">
                  <select className={inputCls} value={form.room_type}
                    onChange={(e) => setForm({ ...form, room_type: e.target.value as Listing["room_type"] })}>
                    <option value="single">Single</option>
                    <option value="double">Double sharing</option>
                    <option value="triple">Triple sharing</option>
                    <option value="dormitory">Dormitory</option>
                  </select>
                </Field>
              </div>

              <Field label="Amenities">
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        form.amenities.includes(a)
                          ? "bg-[#fff7ed] border-[#ea6c0a] text-[#c2410c]"
                          : "border-[#e7e5e4] text-[#57534e] hover:border-[#a8a29e]"
                      }`}>
                      {AMENITY_LABELS[a]}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="House rules">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} value={ruleInput}
                      onChange={(e) => setRuleInput(e.target.value)}
                      placeholder="e.g. No smoking inside rooms"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }} />
                    <button type="button" onClick={addRule}
                      className="px-4 py-2.5 bg-[#f5f5f4] text-[#57534e] rounded-xl text-sm font-medium hover:bg-[#e7e5e4] transition-colors">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.rules.map((rule, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs bg-[#f5f5f4] text-[#57534e] px-3 py-1.5 rounded-lg">
                        {rule}
                        <button type="button"
                          onClick={() => setForm({ ...form, rules: form.rules.filter((_, j) => j !== i) })}
                          className="text-[#a8a29e] hover:text-red-500 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e7e5e4]">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors">
                Cancel
              </button>
              <button onClick={saveListing} disabled={saving}
                className="flex items-center gap-2 bg-[#ea6c0a] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? "Save changes" : "Create listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Floors & Beds Modal ──────────────────────────────────────────────────────

function FloorsBedModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);

  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [sharingTypes, setSharingTypes] = useState<SharingTypeWithCounts[]>([]);
  const [numFloors, setNumFloors] = useState(1);
  const [loadingFloors, setLoadingFloors] = useState(true);
  const [settingFloors, setSettingFloors] = useState(false);
  const [loadingST, setLoadingST] = useState(false);
  const [addingST, setAddingST] = useState(false);
  const [deletingST, setDeletingST] = useState<string | null>(null);
  const [stForm, setStForm] = useState({
    sharing_type: 2, rent_per_person: 0, total_rooms: 1, beds_per_room: 2,
  });

  const fetchFloors = useCallback(async () => {
    setLoadingFloors(true);
    const { data } = await supabase
      .from("listing_floors")
      .select("id, floor_number, floor_label")
      .eq("listing_id", listing.id)
      .order("floor_number");
    const f = (data as Floor[]) || [];
    setFloors(f);
    setLoadingFloors(false);
    return f;
  }, [supabase, listing.id]);

  const fetchSharingTypes = useCallback(async (floorId: string) => {
    setLoadingST(true);
    const { data } = await supabase
      .from("listing_sharing_types")
      .select("id, floor_id, sharing_type, rent_per_person, total_rooms, beds_per_room, is_active, beds:listing_beds(id, status)")
      .eq("floor_id", floorId)
      .eq("listing_id", listing.id);

    const processed: SharingTypeWithCounts[] = ((data as RawSharingType[]) || []).map(st => ({
      id: st.id,
      floor_id: st.floor_id,
      sharing_type: st.sharing_type,
      rent_per_person: st.rent_per_person,
      total_rooms: st.total_rooms,
      beds_per_room: st.beds_per_room,
      is_active: st.is_active,
      total_beds: st.beds?.length || 0,
      available_beds: (st.beds || []).filter(b => b.status === "available").length,
    }));
    setSharingTypes(processed);
    setLoadingST(false);
  }, [supabase, listing.id]);

  useEffect(() => {
    fetchFloors().then(f => {
      if (f.length > 0) setActiveFloorId(prev => prev || f[0].id);
    });
  }, [fetchFloors]);

  useEffect(() => {
    if (floors.length > 0 && !activeFloorId) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  useEffect(() => {
    if (activeFloorId) fetchSharingTypes(activeFloorId);
  }, [activeFloorId, fetchSharingTypes]);

  const handleSetFloors = async () => {
    setSettingFloors(true);
    for (let i = 0; i < numFloors; i++) {
      const existing = floors.find(f => f.floor_number === i);
      if (!existing) {
        await supabase.from("listing_floors").insert({
          listing_id: listing.id,
          floor_number: i,
          floor_label: FLOOR_LABELS[i] || `${i}th Floor`,
        });
      }
    }
    const f = await fetchFloors();
    if (f.length > 0) setActiveFloorId(prev => prev || f[0].id);
    setSettingFloors(false);
    toast.success("Floors configured!");
  };

  const addSharingType = async () => {
    if (!activeFloorId) return;
    if (stForm.rent_per_person <= 0) { toast.error("Enter rent per person"); return; }
    if (stForm.total_rooms <= 0) { toast.error("Enter number of rooms"); return; }
    if (sharingTypes.find(st => st.sharing_type === stForm.sharing_type)) {
      toast.error("This sharing type already exists on this floor");
      return;
    }

    setAddingST(true);

    const { data: stData, error: stErr } = await supabase
      .from("listing_sharing_types")
      .insert({
        listing_id: listing.id,
        floor_id: activeFloorId,
        sharing_type: stForm.sharing_type,
        rent_per_person: stForm.rent_per_person,
        total_rooms: stForm.total_rooms,
        beds_per_room: stForm.beds_per_room,
      })
      .select()
      .single();

    if (stErr || !stData) {
      toast.error("Failed to add sharing type");
      setAddingST(false);
      return;
    }

    const floor = floors.find(f => f.id === activeFloorId);
    const prefix = floor ? floorPrefix(floor.floor_number) : "G";

    // Auto-generate rooms and beds
    for (let r = 0; r < stForm.total_rooms; r++) {
      const roomNumber = `${prefix}${stData.sharing_type}${String(r + 1).padStart(2, "0")}`;
      const { data: roomData, error: roomErr } = await supabase
        .from("listing_rooms")
        .insert({
          listing_id: listing.id,
          floor_id: activeFloorId,
          sharing_type_id: stData.id,
          room_number: roomNumber,
        })
        .select()
        .single();

      if (roomErr || !roomData) continue;

      for (let b = 0; b < stForm.beds_per_room; b++) {
        await supabase.from("listing_beds").insert({
          room_id: roomData.id,
          listing_id: listing.id,
          floor_id: activeFloorId,
          sharing_type_id: stData.id,
          bed_number: b + 1,
          status: "available",
        });
      }
    }

    toast.success(
      `Added ${SHARING_LABELS[stForm.sharing_type]} — ${stForm.total_rooms} room${stForm.total_rooms > 1 ? "s" : ""}, ` +
      `${stForm.total_rooms * stForm.beds_per_room} beds total`
    );
    await fetchSharingTypes(activeFloorId);
    setStForm({ sharing_type: 2, rent_per_person: 0, total_rooms: 1, beds_per_room: 2 });
    setAddingST(false);
  };

  const deleteSharingType = async (stId: string) => {
    if (!confirm("Delete this sharing type? All rooms and beds will be permanently removed.")) return;
    setDeletingST(stId);
    await supabase.from("listing_sharing_types").delete().eq("id", stId);
    if (activeFloorId) await fetchSharingTypes(activeFloorId);
    setDeletingST(null);
    toast.success("Sharing type deleted");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e7e5e4]">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1c1917] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#ea6c0a]" /> Floors & Beds
            </h2>
            <p className="text-sm text-[#78716c] mt-0.5">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#a8a29e] hover:text-[#1c1917] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section A: Floor setup */}
          <div className="bg-[#fafaf9] border border-[#e7e5e4] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#1c1917] mb-3">Floor Setup</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#57534e] mb-1.5">Number of floors</label>
                <select
                  value={numFloors}
                  onChange={e => setNumFloors(Number(e.target.value))}
                  className={inputCls}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n === 1 ? "1 floor (Ground only)" : `${n} floors (Ground + ${n - 1} upper)`}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSetFloors}
                disabled={settingFloors}
                className="flex items-center gap-2 bg-[#ea6c0a] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {settingFloors ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Set floors
              </button>
            </div>

            {loadingFloors ? (
              <div className="flex items-center gap-2 mt-3 text-xs text-[#a8a29e]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
              </div>
            ) : floors.length > 0 ? (
              <p className="text-xs text-[#78716c] mt-2">
                {floors.length} floor{floors.length > 1 ? "s" : ""} configured: {floors.map(f => f.floor_label).join(", ")}
              </p>
            ) : (
              <p className="text-xs text-[#a8a29e] mt-2">
                No floors yet. Select a count above and click &quot;Set floors&quot;.
              </p>
            )}
          </div>

          {/* Section B: Floor tabs + sharing types */}
          {floors.length > 0 && (
            <div>
              {/* Floor tabs */}
              <div className="flex gap-0 overflow-x-auto border-b border-[#e7e5e4] mb-5">
                {floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => setActiveFloorId(floor.id)}
                    className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all ${
                      activeFloorId === floor.id
                        ? "border-[#ea6c0a] text-[#c2410c]"
                        : "border-transparent text-[#57534e] hover:text-[#1c1917]"
                    }`}
                  >
                    {floor.floor_label}
                  </button>
                ))}
              </div>

              {activeFloorId && (
                <div className="space-y-4">
                  {/* Add sharing type form */}
                  <div className="border border-[#e7e5e4] rounded-xl p-4">
                    <p className="text-xs font-medium text-[#57534e] mb-3">Add Sharing Type</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#78716c] mb-1">Sharing type</label>
                        <select
                          value={stForm.sharing_type}
                          onChange={e => {
                            const st = Number(e.target.value);
                            setStForm(f => ({ ...f, sharing_type: st, beds_per_room: st }));
                          }}
                          className={inputCls}
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{SHARING_LABELS[n]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-[#78716c] mb-1">Rent per person (₹)</label>
                        <input
                          type="number"
                          value={stForm.rent_per_person || ""}
                          onChange={e => setStForm(f => ({ ...f, rent_per_person: Number(e.target.value) }))}
                          placeholder="8000"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#78716c] mb-1">Number of rooms on this floor</label>
                        <input
                          type="number"
                          min={1}
                          value={stForm.total_rooms}
                          onChange={e => setStForm(f => ({ ...f, total_rooms: Number(e.target.value) }))}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#78716c] mb-1">Beds per room</label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={stForm.beds_per_room}
                          onChange={e => setStForm(f => ({ ...f, beds_per_room: Number(e.target.value) }))}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addSharingType}
                      disabled={addingST}
                      className="mt-3 flex items-center gap-2 bg-[#ea6c0a] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#c2410c] transition-colors disabled:opacity-50"
                    >
                      {addingST ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Sharing Type
                    </button>
                  </div>

                  {/* Existing sharing types table */}
                  {loadingST ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-[#ea6c0a]" />
                    </div>
                  ) : sharingTypes.length > 0 ? (
                    <div className="overflow-x-auto border border-[#e7e5e4] rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#e7e5e4] bg-[#fafaf9]">
                          <tr>
                            {["Type", "Rent/person", "Rooms", "Beds/room", "Available", ""].map(h => (
                              <th key={h} className="text-left text-xs font-medium text-[#78716c] px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f5f4]">
                          {sharingTypes.map(st => (
                            <tr key={st.id} className="hover:bg-[#fafaf9] transition-colors">
                              <td className="px-4 py-3 font-medium text-[#1c1917]">{SHARING_LABELS[st.sharing_type]}</td>
                              <td className="px-4 py-3 text-[#57534e]">₹{st.rent_per_person.toLocaleString("en-IN")}</td>
                              <td className="px-4 py-3 text-[#57534e]">{st.total_rooms}</td>
                              <td className="px-4 py-3 text-[#57534e]">{st.beds_per_room}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  st.available_beds > 0 ? "bg-green-50 text-green-700" : "bg-[#f5f5f4] text-[#78716c]"
                                }`}>
                                  {st.available_beds}/{st.total_beds} beds
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => deleteSharingType(st.id)}
                                  disabled={!!deletingST}
                                  className="p-1.5 text-[#a8a29e] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  {deletingST === st.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-[#a8a29e] border border-dashed border-[#e7e5e4] rounded-xl">
                      No sharing types configured for this floor yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputCls = "w-full border border-[#e7e5e4] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#ea6c0a] focus:ring-1 focus:ring-[#ea6c0a] transition-all bg-white text-[#1c1917] placeholder:text-[#a8a29e]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#57534e] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
