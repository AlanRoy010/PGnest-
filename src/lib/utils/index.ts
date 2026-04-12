import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format INR currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format currency compact: ₹12,000 → ₹12K
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

// Format date
export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

// Format date relative
export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Deposit balance percentage
export function depositPercentage(current: number, original: number): number {
  if (original === 0) return 0;
  return Math.round((current / original) * 100);
}

// Amenity labels map
export const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  ac: "Air Conditioning",
  meals: "Meals Included",
  laundry: "Laundry",
  parking: "Parking",
  geyser: "Geyser",
  tv: "TV",
  fridge: "Refrigerator",
  gym: "Gym",
  security: "24/7 Security",
  housekeeping: "Housekeeping",
  power_backup: "Power Backup",
};

export const AREAS_MUMBAI = [
  "Andheri West", "Andheri East", "Bandra West", "Bandra East",
  "Powai", "Kurla", "Ghatkopar", "Thane West", "Thane East",
  "Borivali", "Goregaon", "Malad", "Kandivali", "Dahisar",
  "Vikhroli", "Mulund", "Wadala", "Chembur", "Govandi",
  "Dharavi", "Sion", "Dadar", "Parel", "Worli",
  "Lower Parel", "Byculla", "Grant Road", "Matunga",
  "Vile Parle", "Santacruz", "Khar", "Juhu",
];

export const AMENITIES_LIST = Object.keys(AMENITY_LABELS);

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Booking status colors
export const BOOKING_STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  approved:  { label: "Approved",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected:  { label: "Rejected",  color: "bg-red-50 text-red-700 border-red-200" },
  active:    { label: "Active",    color: "bg-green-50 text-green-700 border-green-200" },
  completed: { label: "Completed", color: "bg-surface-50 text-surface-600 border-surface-200" },
  cancelled: { label: "Cancelled", color: "bg-surface-50 text-surface-500 border-surface-200" },
} as const;

export const DEDUCTION_STATUS_CONFIG = {
  pending:  { label: "Pending tenant review", color: "bg-yellow-50 text-yellow-700" },
  approved: { label: "Approved",              color: "bg-green-50 text-green-700" },
  disputed: { label: "Disputed",              color: "bg-red-50 text-red-700" },
  rejected: { label: "Rejected by owner",     color: "bg-surface-50 text-surface-600" },
} as const;