-- ============================================================================
-- EcoP — seed data
-- ============================================================================
-- Creates 3 demo bins, 6 demo rewards, and the achievement catalogue.
-- A judge can test the full flow (scan → dashboard → redeem) within ~2 minutes
-- of cloning.
--
-- Run after 0001_init.sql. Safe to re-run (idempotent on natural keys).
-- ============================================================================

-- ── Demo bins (id == QR code value) ─────────────────────────────────────────
insert into public.bins (id, location, status) values
  ('BIN-014', 'Main Library, Ground Floor', 'active'),
  ('BIN-015', 'Cafeteria, North Block', 'active'),
  ('BIN-016', 'Sports Complex, Entrance A', 'maintenance')
on conflict (id) do update set
  location = excluded.location,
  status   = excluded.status;

-- ── Demo rewards (6) ────────────────────────────────────────────────────────
insert into public.rewards (name, description, cost_points, stock, image_url, active) values
  ('Campus Coffee Voucher',
   'A free coffee at any campus café. Redeem in-app and show the code at the counter.',
   100, 50, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', true),
  ('EcoP Sticker Pack',
   'A set of 5 vinyl EcoP stickers. Pick up from the sustainability office.',
   50, 200, 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400', true),
  ('Reusable Water Bottle',
   'A premium EcoP-branded insulated bottle. Reduce plastic, stay hydrated.',
   500, 25, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', true),
  ('EcoP T-Shirt',
   'A 100% organic cotton EcoP T-shirt in your size. Limited stock.',
   1000, 12, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', true),
  ('Tree Planted In Your Name',
   'We plant a native tree on campus and tag it with your name in our impact ledger.',
   2000, 100, 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400', true),
  ('Library Late-Fee Waiver',
   'Waive one library late-return fee. One per user per semester.',
   300, 0, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400', true)
on conflict do nothing;

-- ── Achievement catalogue (9) ───────────────────────────────────────────────
insert into public.achievements (code, name, description, icon, condition_type, threshold) values
  ('FIRST_BOTTLE',  'First Bottle',    'Recycle your first plastic bottle.',          '🌱', 'disposals', 1),
  ('ECO_BEGINNER',  'Eco Beginner',    'Complete 5 verified disposals.',              '♻️', 'disposals', 5),
  ('BOTTLES_10',    'Bottle Collector','Reach 10 verified disposals.',                '🎯', 'disposals', 10),
  ('PLASTIC_HERO',  'Plastic Hero',    'Reach 25 verified disposals.',                '🦸', 'disposals', 25),
  ('BOTTLES_50',    'Half Century',    'Reach 50 verified disposals.',                '🏅', 'disposals', 50),
  ('GREEN_GUARDIAN','Green Guardian',  'Reach 75 verified disposals.',                '🌳', 'disposals', 75),
  ('BOTTLES_100',   'Centurion',       'Reach 100 verified disposals.',               '💯', 'disposals', 100),
  ('ECO_LEGEND',    'Eco Legend',      'Reach 200 verified disposals.',               '👑', 'disposals', 200),
  ('POINT_PRO',     'Point Pro',       'Accumulate 500 Eco Points.',                  '⭐', 'points',    500)
on conflict (code) do nothing;
