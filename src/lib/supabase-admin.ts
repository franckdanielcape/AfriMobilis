// =====================================================
// SUPABASE ADMIN CLIENT - Côté serveur uniquement
// =====================================================
// Ce fichier utilise le Service Role Key pour bypasser RLS
// À utiliser UNIQUEMENT dans les Server Actions ou API Routes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Créer un client admin uniquement si les variables sont définies
export const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export function isAdminAvailable(): boolean {
  return supabaseAdmin !== null;
}
