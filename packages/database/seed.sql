-- Seed data for AfriMobilis

-- Initial Syndicat
INSERT INTO syndicats (id, nom, code, statut)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Syndicat Central Grand-Bassam',
  'SCGB-01',
  'actif'
) ON CONFLICT (code) DO NOTHING;

-- Initial Line
INSERT INTO lignes (id, syndicat_id, nom, tarif_base)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Ligne Principal Mairie',
  200.00
) ON CONFLICT DO NOTHING;

-- Initial User Profile will be created by Supabase Auth trigger usually.
-- But we can seed a default super admin if we want.
