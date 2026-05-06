-- Admin bypass RLS policies
-- Admins need full read/write access across all tables for dashboard stats and management.
-- Each policy checks profiles.role = 'admin' for the current session user.

-- Helper: reusable admin check expression used in every policy below.
-- EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')

-- listings: admin can see ALL listings (including inactive from other owners)
--           and can update/delete any listing
CREATE POLICY "listings_admin_all" ON listings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- bookings: admin can see and update all bookings
CREATE POLICY "bookings_admin_all" ON bookings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- payments: admin can see all payments
CREATE POLICY "payments_admin_all" ON payments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- deposits: admin can see and manage all deposits
CREATE POLICY "deposits_admin_all" ON deposits
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- deposit_deductions: admin can see and manage all deductions
CREATE POLICY "deductions_admin_all" ON deposit_deductions
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- notifications: admin can see all notifications (e.g. for support/audit)
CREATE POLICY "notifications_admin_all" ON notifications
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
