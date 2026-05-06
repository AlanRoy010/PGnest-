-- Bed reservation system + visit scheduling tables
-- Run after 003_admin_rls_policies.sql

-- ─── Add beds_per_room to listings ───────────────────────────────────────────
ALTER TABLE listings ADD COLUMN IF NOT EXISTS beds_per_room INTEGER NOT NULL DEFAULT 1;

-- ─── TABLE: listing_floors ────────────────────────────────────────────────────
CREATE TABLE listing_floors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  floor_number  INTEGER NOT NULL,
  floor_label   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, floor_number)
);

CREATE INDEX idx_listing_floors_listing_id ON listing_floors(listing_id);

-- ─── TABLE: listing_sharing_types ────────────────────────────────────────────
CREATE TABLE listing_sharing_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  floor_id        UUID NOT NULL REFERENCES listing_floors(id) ON DELETE CASCADE,
  sharing_type    INTEGER NOT NULL CHECK (sharing_type BETWEEN 1 AND 6),
  rent_per_person INTEGER NOT NULL,
  total_rooms     INTEGER NOT NULL DEFAULT 1,
  beds_per_room   INTEGER NOT NULL DEFAULT 1,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, floor_id, sharing_type)
);

CREATE INDEX idx_listing_sharing_types_listing_id ON listing_sharing_types(listing_id);
CREATE INDEX idx_listing_sharing_types_floor_id ON listing_sharing_types(floor_id);

-- ─── TABLE: listing_rooms ─────────────────────────────────────────────────────
CREATE TABLE listing_rooms (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  floor_id          UUID NOT NULL REFERENCES listing_floors(id) ON DELETE CASCADE,
  sharing_type_id   UUID NOT NULL REFERENCES listing_sharing_types(id),
  room_number       TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, room_number)
);

CREATE INDEX idx_listing_rooms_listing_id ON listing_rooms(listing_id);
CREATE INDEX idx_listing_rooms_floor_id ON listing_rooms(floor_id);

-- ─── TABLE: listing_beds ─────────────────────────────────────────────────────
-- listing_id, floor_id, sharing_type_id are denormalized for easier querying
CREATE TABLE listing_beds (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id           UUID NOT NULL REFERENCES listing_rooms(id) ON DELETE CASCADE,
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  floor_id          UUID NOT NULL REFERENCES listing_floors(id) ON DELETE CASCADE,
  sharing_type_id   UUID NOT NULL REFERENCES listing_sharing_types(id) ON DELETE CASCADE,
  bed_number        INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'occupied')),
  reserved_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reserved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, bed_number)
);

CREATE INDEX idx_listing_beds_room_id ON listing_beds(room_id);
CREATE INDEX idx_listing_beds_status ON listing_beds(status);
CREATE INDEX idx_listing_beds_reserved_by ON listing_beds(reserved_by);

-- ─── TABLE: bed_reservations ─────────────────────────────────────────────────
CREATE TABLE bed_reservations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bed_id            UUID NOT NULL REFERENCES listing_beds(id) ON DELETE RESTRICT,
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  floor_id          UUID NOT NULL REFERENCES listing_floors(id),
  sharing_type_id   UUID NOT NULL REFERENCES listing_sharing_types(id),
  tenant_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  tenant_message    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bed_reservations_updated_at
  BEFORE UPDATE ON bed_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_bed_reservations_bed_id ON bed_reservations(bed_id);
CREATE INDEX idx_bed_reservations_listing_id ON bed_reservations(listing_id);
CREATE INDEX idx_bed_reservations_tenant_id ON bed_reservations(tenant_id);
CREATE INDEX idx_bed_reservations_status ON bed_reservations(status);

-- ─── TABLE: visit_schedules ───────────────────────────────────────────────────
CREATE TABLE visit_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  visit_date  DATE NOT NULL,
  visit_time  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visit_schedules_listing_id ON visit_schedules(listing_id);
CREATE INDEX idx_visit_schedules_visit_date ON visit_schedules(visit_date);
CREATE INDEX idx_visit_schedules_user_id ON visit_schedules(user_id);

-- ─── ENABLE RLS ───────────────────────────────────────────────────────────────
ALTER TABLE listing_floors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_sharing_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_beds          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_schedules       ENABLE ROW LEVEL SECURITY;

-- ─── RLS: listing_floors ─────────────────────────────────────────────────────
-- Public read (needed by tenant listing detail page without auth)
CREATE POLICY "listing_floors_select" ON listing_floors
  FOR SELECT USING (true);

CREATE POLICY "listing_floors_owner_write" ON listing_floors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  );

CREATE POLICY "listing_floors_admin" ON listing_floors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── RLS: listing_sharing_types ──────────────────────────────────────────────
CREATE POLICY "listing_sharing_types_select" ON listing_sharing_types
  FOR SELECT USING (true);

CREATE POLICY "listing_sharing_types_owner_write" ON listing_sharing_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  );

CREATE POLICY "listing_sharing_types_admin" ON listing_sharing_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── RLS: listing_rooms ───────────────────────────────────────────────────────
CREATE POLICY "listing_rooms_select" ON listing_rooms
  FOR SELECT USING (true);

CREATE POLICY "listing_rooms_owner_write" ON listing_rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid())
  );

CREATE POLICY "listing_rooms_admin" ON listing_rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── RLS: listing_beds ───────────────────────────────────────────────────────
-- Public read (bed availability shown without login)
CREATE POLICY "listing_beds_select" ON listing_beds
  FOR SELECT USING (true);

-- Authenticated users can update beds (tenants to reserve, status transitions)
CREATE POLICY "listing_beds_update_auth" ON listing_beds
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "listing_beds_admin" ON listing_beds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── RLS: bed_reservations ───────────────────────────────────────────────────
-- Tenants see their own; listing owner sees reservations for their listings; admin sees all
CREATE POLICY "bed_reservations_select" ON bed_reservations
  FOR SELECT USING (
    auth.uid() = tenant_id OR
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only tenants can create reservations for themselves
CREATE POLICY "bed_reservations_insert" ON bed_reservations
  FOR INSERT WITH CHECK (
    auth.uid() = tenant_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tenant')
  );

-- Only admin can approve/reject (UPDATE)
CREATE POLICY "bed_reservations_admin" ON bed_reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── RLS: visit_schedules ────────────────────────────────────────────────────
-- Anyone (including unauthenticated) can insert — visit scheduling is open
CREATE POLICY "visit_schedules_insert" ON visit_schedules
  FOR INSERT WITH CHECK (true);

-- Logged-in users can see their own scheduled visits; admin sees all
CREATE POLICY "visit_schedules_select" ON visit_schedules
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "visit_schedules_admin" ON visit_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
