-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('tenant', 'owner');
CREATE TYPE gender_pref AS ENUM ('male', 'female', 'any');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_type AS ENUM ('deposit', 'first_rent', 'monthly_rent', 'deposit_refund');
CREATE TYPE deduction_status AS ENUM ('pending', 'approved', 'disputed', 'rejected');
CREATE TYPE deposit_status AS ENUM ('active', 'refund_initiated', 'closed');
CREATE TYPE furnishing_type AS ENUM ('furnished', 'semi-furnished', 'unfurnished');
CREATE TYPE room_type AS ENUM ('single', 'double', 'triple', 'dormitory');
CREATE TYPE notification_type AS ENUM (
  'booking_request', 'booking_approved', 'booking_rejected',
  'deduction_raised', 'deduction_approved', 'deduction_disputed',
  'contract_ending', 'deposit_refund'
);

-- TABLE: profiles
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  email         TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TABLE: listings
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  address           TEXT NOT NULL,
  area              TEXT NOT NULL,
  city              TEXT NOT NULL DEFAULT 'Mumbai',
  pincode           TEXT NOT NULL,
  latitude          DECIMAL(10, 8),
  longitude         DECIMAL(11, 8),
  monthly_rent      INTEGER NOT NULL,
  security_deposit  INTEGER NOT NULL,
  rooms_available   INTEGER NOT NULL DEFAULT 1,
  total_rooms       INTEGER NOT NULL DEFAULT 1,
  gender_preference gender_pref NOT NULL DEFAULT 'any',
  furnishing        furnishing_type NOT NULL,
  room_type         room_type NOT NULL,
  amenities         TEXT[] DEFAULT '{}',
  rules             TEXT[] DEFAULT '{}',
  photos            TEXT[] DEFAULT '{}',
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_listings_owner_id ON listings(owner_id);
CREATE INDEX idx_listings_area ON listings(area);
CREATE INDEX idx_listings_is_active ON listings(is_active);
CREATE INDEX idx_listings_monthly_rent ON listings(monthly_rent);
CREATE INDEX idx_listings_gender_preference ON listings(gender_preference);

-- TABLE: bookings
CREATE TABLE bookings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  tenant_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status            booking_status NOT NULL DEFAULT 'pending',
  move_in_date      DATE NOT NULL,
  move_out_date     DATE,
  monthly_rent      INTEGER NOT NULL,
  security_deposit  INTEGER NOT NULL,
  special_requests  TEXT,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_bookings_tenant_id ON bookings(tenant_id);
CREATE INDEX idx_bookings_owner_id ON bookings(owner_id);
CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- TABLE: payments
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  tenant_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type                  payment_type NOT NULL,
  amount                INTEGER NOT NULL,
  status                payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_signature    TEXT,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_status ON payments(status);

-- TABLE: deposits
CREATE TABLE deposits (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id        UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  original_amount   INTEGER NOT NULL,
  current_balance   INTEGER NOT NULL,
  status            deposit_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT current_balance_non_negative CHECK (current_balance >= 0),
  CONSTRAINT current_balance_lte_original CHECK (current_balance <= original_amount)
);

CREATE TRIGGER deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_deposits_booking_id ON deposits(booking_id);

-- TABLE: deposit_deductions
CREATE TABLE deposit_deductions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id            UUID NOT NULL REFERENCES deposits(id) ON DELETE RESTRICT,
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  raised_by_owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  amount                INTEGER NOT NULL,
  reason                TEXT NOT NULL,
  evidence_photos       TEXT[] DEFAULT '{}',
  status                deduction_status NOT NULL DEFAULT 'pending',
  tenant_response       TEXT,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT deduction_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_deductions_deposit_id ON deposit_deductions(deposit_id);
CREATE INDEX idx_deductions_booking_id ON deposit_deductions(booking_id);
CREATE INDEX idx_deductions_status ON deposit_deductions(status);

-- TRIGGER: Auto-update deposit balance when deduction approved
CREATE OR REPLACE FUNCTION update_deposit_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE deposits
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.deposit_id;
  END IF;

  IF OLD.status = 'approved' AND NEW.status IN ('rejected', 'disputed') THEN
    UPDATE deposits
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.deposit_id;
  END IF;

  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    NEW.resolved_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduction_balance_update
  BEFORE UPDATE ON deposit_deductions
  FOR EACH ROW EXECUTE FUNCTION update_deposit_balance();

-- TRIGGER: Create deposit when booking becomes active
CREATE OR REPLACE FUNCTION create_deposit_on_booking_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    INSERT INTO deposits (booking_id, original_amount, current_balance)
    VALUES (NEW.id, NEW.security_deposit, NEW.security_deposit)
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_creates_deposit
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_deposit_on_booking_active();

-- TRIGGER: Update listing availability on booking changes
CREATE OR REPLACE FUNCTION update_listing_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'approved' THEN
    UPDATE listings
    SET rooms_available = GREATEST(0, rooms_available - 1)
    WHERE id = NEW.listing_id;
  END IF;

  IF NEW.status IN ('completed', 'cancelled') AND OLD.status = 'active' THEN
    UPDATE listings
    SET rooms_available = LEAST(total_rooms, rooms_available + 1)
    WHERE id = NEW.listing_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_updates_availability
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_listing_availability();

-- TABLE: notifications
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS POLICIES: listings
CREATE POLICY "listings_select_active" ON listings FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "listings_insert_owner" ON listings FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "listings_update_own" ON listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "listings_delete_own" ON listings FOR DELETE USING (auth.uid() = owner_id);

-- RLS POLICIES: bookings
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (
  auth.uid() = tenant_id OR auth.uid() = owner_id
);
CREATE POLICY "bookings_insert_tenant" ON bookings FOR INSERT WITH CHECK (
  auth.uid() = tenant_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tenant')
);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (
  auth.uid() = tenant_id OR auth.uid() = owner_id
);

-- RLS POLICIES: payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (
  auth.uid() = tenant_id OR
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.owner_id = auth.uid())
);
CREATE POLICY "payments_insert_tenant" ON payments FOR INSERT WITH CHECK (auth.uid() = tenant_id);

-- RLS POLICIES: deposits
CREATE POLICY "deposits_select" ON deposits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id
    AND (bookings.tenant_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

-- RLS POLICIES: deposit_deductions
CREATE POLICY "deductions_select" ON deposit_deductions FOR SELECT USING (
  auth.uid() = raised_by_owner_id OR
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id AND bookings.tenant_id = auth.uid()
  )
);
CREATE POLICY "deductions_insert_owner" ON deposit_deductions FOR INSERT WITH CHECK (
  auth.uid() = raised_by_owner_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);
CREATE POLICY "deductions_update" ON deposit_deductions FOR UPDATE USING (
  auth.uid() = raised_by_owner_id OR
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_id AND bookings.tenant_id = auth.uid()
  )
);

-- RLS POLICIES: notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- FUNCTION: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'tenant')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();