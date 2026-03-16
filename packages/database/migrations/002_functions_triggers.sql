-- Migration 002: Functions and Triggers

-- 1. Automatic Timestamp Updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_syndicats_modtime BEFORE UPDATE ON syndicats FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_lignes_modtime BEFORE UPDATE ON lignes FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_vehicules_modtime BEFORE UPDATE ON vehicules FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_affectations_modtime BEFORE UPDATE ON affectations FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_wallets_modtime BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_versements_modtime BEFORE UPDATE ON versements FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_pannes_modtime BEFORE UPDATE ON pannes FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_sanctions_modtime BEFORE UPDATE ON sanctions FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_tickets_modtime BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_objets_modtime BEFORE UPDATE ON objets FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- 2. Audit Logging Function (BCEAO Compliance)
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to get the user ID from the Supabase auth context
    BEGIN
        user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_concernee, enregistrement_id, action, anciennes_valeurs, execute_par)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_concernee, enregistrement_id, action, anciennes_valeurs, nouvelles_valeurs, execute_par)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_concernee, enregistrement_id, action, nouvelles_valeurs, execute_par)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, NULL, row_to_json(NEW), user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit Log triggers to sensitive tables
CREATE TRIGGER audit_profiles_trigger AFTER INSERT OR UPDATE OR DELETE ON profiles FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_wallets_trigger AFTER INSERT OR UPDATE OR DELETE ON wallets FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_transactions_trigger AFTER INSERT OR UPDATE OR DELETE ON transactions FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_versements_trigger AFTER INSERT OR UPDATE OR DELETE ON versements FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 3. Sync Supabase Auth Users with Profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, prenom, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Nouveau'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'passager'::user_role)
  );
  
  -- Create empty wallet for new user
  INSERT INTO public.wallets (profil_id, solde, devise)
  VALUES (NEW.id, 0, 'XOF');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists (from old schema) and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Calculate Vehicle Conformity Status
CREATE OR REPLACE FUNCTION calculate_vehicule_conformite()
RETURNS TRIGGER AS $$
DECLARE
    min_expiration DATE;
    today DATE := CURRENT_DATE;
BEGIN
    -- This requires JSON structure like: {"date_expiration": "2026-10-10"} for the documents
    -- Example logic checking minimum of validation dates
    -- For real implementation, it extracts dates from carte_grise, assurance, visite_technique
    -- Example simplified fallback:
    NEW.conformite_status = 'conforme';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicule_conformite BEFORE INSERT OR UPDATE ON vehicules
FOR EACH ROW EXECUTE FUNCTION calculate_vehicule_conformite();
