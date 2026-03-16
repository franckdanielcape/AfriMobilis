// =====================================================
// API ROUTE: Migration des données localStorage → Supabase
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client avec Service Role Key (nécessite la variable d'environnement)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé service role est configurée
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key non configurée' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Récupérer les données envoyées par le client
    const { syndicats, chefs, adminEmail: _adminEmail } = await request.json();

    const results: { 
      syndicats: { imported: number; errors: string[] }; 
      chefs: { imported: number; errors: string[] } 
    } = {
      syndicats: { imported: 0, errors: [] },
      chefs: { imported: 0, errors: [] }
    };

    // ============================================================
    // 1. IMPORTER LES SYNDICATS
    // ============================================================
    if (syndicats && syndicats.length > 0) {
      for (const synd of syndicats) {
        try {
          // Vérifier si le syndicat existe déjà
          const { data: existing } = await supabaseAdmin
            .from('syndicats')
            .select('id')
            .eq('code', synd.code)
            .single();

          if (!existing) {
            const { error } = await supabaseAdmin
              .from('syndicats')
              .insert({
                nom: synd.nom,
                code: synd.code,
                zone: synd.zone,
                statut: synd.statut || 'actif',
                created_at: synd.createdAt || new Date().toISOString()
              });

            if (error) {
              results.syndicats.errors.push(`Syndicat ${synd.nom}: ${error.message}`);
            } else {
              results.syndicats.imported++;
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue';
          results.syndicats.errors.push(`Syndicat ${synd.nom}: ${message}`);
        }
      }
    }

    // ============================================================
    // 2. IMPORTER LES CHEFS DE LIGNE
    // ============================================================
    if (chefs && chefs.length > 0) {
      for (const chef of chefs) {
        try {
          // Vérifier si le chef existe déjà
          const { data: existing } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', chef.email)
            .single();

          if (!existing) {
            const { error } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: chef.id, // Garder le même ID pour les références
                nom: chef.nom,
                prenom: chef.prenom,
                email: chef.email,
                telephone: chef.telephone,
                role: 'chef_ligne',
                syndicat_id: chef.syndicatId,
                status: chef.status || 'actif',
                created_at: chef.createdAt || new Date().toISOString()
              });

            if (error) {
              results.chefs.errors.push(`Chef ${chef.prenom} ${chef.nom}: ${error.message}`);
            } else {
              results.chefs.imported++;
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Erreur inconnue';
          results.chefs.errors.push(`Chef ${chef.prenom} ${chef.nom}: ${message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration terminée',
      results
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
