// =====================================================
// API ROUTE: Statistiques globales (bypass RLS)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(_request: NextRequest) {
  try {
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key non configurée' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Récupérer TOUTES les données pour debugging
    const { data: allProfiles, error: _profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, nom, prenom, role, syndicat_id, email');

    // Erreurs ignorées - utiliser les données disponibles

    const { data: allSyndicats, error: _syndicatsError } = await supabaseAdmin
      .from('syndicats')
      .select('id, nom');



    // Compter précisément
    const usersCount = allProfiles?.length || 0;
    const syndicatsCount = allSyndicats?.length || 0;
    
    const proprietairesCount = allProfiles?.filter(p => p.role === 'proprietaire').length || 0;
    const chauffeursCount = allProfiles?.filter(p => p.role === 'chauffeur').length || 0;
    
    // Chefs actifs = role chef_ligne ET syndicat_id non null
    const chefsCount = allProfiles?.filter(p => 
      p.role === 'chef_ligne' && p.syndicat_id !== null
    ).length || 0;

    const { count: vehiculesCount } = await supabaseAdmin
      .from('vehicules')
      .select('*', { count: 'exact', head: true });

    // Calculer le volume des transactions (versements)
    const { data: versements } = await supabaseAdmin
      .from('versements')
      .select('montant');
    
    const transactionsSum = versements 
      ? versements.reduce((acc, v) => acc + (Number(v.montant) || 0), 0)
      : 0;



    return NextResponse.json({
      success: true,
      data: {
        usersCount,
        syndicatsCount,
        vehiculesCount: vehiculesCount || 0,
        proprietairesCount,
        chauffeursCount,
        chefsCount,
        transactionsSum
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
