// ============================================================
// DATABASE TYPES — mirrors Supabase schema exactly
// ============================================================

export type UserRole = "tenant" | "owner"| "admin";
export type Gender = "male" | "female" | "any";
export type BookingStatus = "pending" | "approved" | "rejected" | "active" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type DeductionStatus = "pending" | "approved" | "disputed" | "rejected";
export type NotificationType = "booking_request" | "booking_approved" | "booking_rejected" | "deduction_raised" | "deduction_approved" | "deduction_disputed" | "contract_ending" | "deposit_refund";

// ── Profiles ──────────────────────────────────────────────
export interface Profile {
  id: string;                      // matches auth.users.id
  full_name: string;
  phone: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Listings ──────────────────────────────────────────────
export interface Listing {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  address: string;
  area: string;                    // e.g. "Andheri West"
  city: string;                    // default "Mumbai"
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  monthly_rent: number;            // in INR
  security_deposit: number;        // in INR
  rooms_available: number;
  total_rooms: number;
  beds_per_room: number; 
  gender_preference: Gender;
  furnishing: "furnished" | "semi-furnished" | "unfurnished";
  room_type: "single" | "double" | "triple" | "dormitory";
  amenities: string[];             // e.g. ["wifi", "ac", "meals", "laundry"]
  rules: string[];                 // e.g. ["no smoking", "no pets"]
  photos: string[];                // Supabase storage URLs
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  owner?: Profile;
}

// ── Bookings ──────────────────────────────────────────────
export interface Booking {
  id: string;
  listing_id: string;
  tenant_id: string;
  owner_id: string;
  status: BookingStatus;
  move_in_date: string;            // ISO date
  move_out_date: string | null;    // ISO date, null = open-ended
  monthly_rent: number;
  security_deposit: number;
  special_requests: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // joined
  listing?: Listing;
  tenant?: Profile;
  owner?: Profile;
  deposit?: Deposit;
  payments?: Payment[];
}

// ── Payments ──────────────────────────────────────────────
export interface Payment {
  id: string;
  booking_id: string;
  tenant_id: string;
  type: "deposit" | "first_rent" | "monthly_rent" | "deposit_refund";
  amount: number;
  status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  paid_at: string | null;
  created_at: string;
}

// ── Deposit Tracker ───────────────────────────────────────
export interface Deposit {
  id: string;
  booking_id: string;
  original_amount: number;         // locked at booking time, never changes
  current_balance: number;         // original - sum of approved deductions
  status: "active" | "refund_initiated" | "closed";
  created_at: string;
  updated_at: string;
  // joined
  deductions?: DepositDeduction[];
}

export interface DepositDeduction {
  id: string;
  deposit_id: string;
  booking_id: string;
  raised_by_owner_id: string;
  amount: number;
  reason: string;
  evidence_photos: string[];       // optional photos of damage
  status: DeductionStatus;
  tenant_response: string | null;  // tenant's dispute message
  resolved_at: string | null;
  created_at: string;
  // joined
  raised_by?: Profile;
}

// ── Notifications ─────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;  // e.g. { booking_id, deduction_id }
  is_read: boolean;
  created_at: string;
}

// ============================================================
// FORM TYPES — for react-hook-form + zod
// ============================================================

export interface CreateListingForm {
  title: string;
  description: string;
  address: string;
  area: string;
  pincode: string;
  monthly_rent: number;
  security_deposit: number;
  rooms_available: number;
  total_rooms: number;
  beds_per_room: number; 
  gender_preference: Gender;
  furnishing: Listing["furnishing"];
  room_type: Listing["room_type"];
  amenities: string[];
  rules: string[];
}

export interface BookingRequestForm {
  listing_id: string;
  move_in_date: string;
  special_requests?: string;
}

export interface DeductionForm {
  amount: number;
  reason: string;
  evidence_photos?: string[];
}

export interface DisputeForm {
  tenant_response: string;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Listing filters (for search page) ────────────────────
export interface ListingFilters {
  area?: string;
  min_rent?: number;
  max_rent?: number;
  gender_preference?: Gender | "any";
  furnishing?: Listing["furnishing"];
  room_type?: Listing["room_type"];
  amenities?: string[];
  sort_by?: "rent_asc" | "rent_desc" | "newest";
  page?: number;
}

// ── Razorpay (browser SDK types) ─────────────────────────
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}