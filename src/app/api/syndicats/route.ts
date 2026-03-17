// =====================================================
// API ROUTE: Création de syndicats (bypass RLS)
// Utilise la Service Role Key côté serveur
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé service role est configurée
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key non configurée. Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local' },
        { status: 500 }
      );
    }

    // Créer un client admin avec la service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Récupérer les données du body
    const { nom, code, zone, zone_geographique } = await request.json();

    // Validation
    if (!nom || !code || !zone) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: nom, code, zone' },
        { status: 400 }
      );
    }

    // Insérer dans Supabase (bypass RLS grâce à la service role key)
    const { data, error } = await supabaseAdmin
      .from('syndicats')
      .insert({
        nom,
        code,
        zone,
        zone_geographique: zone_geographique || { region: zone },
        statut: 'actif'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Syndicat créé avec succès',
      data
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Récupérer tous les syndicats (bypass RLS avec Service Role Key)
export async function GET(_request: NextRequest) {
  try {
    // Vérifier que la clé service role est configurée
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key non configurée' },
        { status: 500 }
      );
    }

    // Créer un client admin avec la service role key pour bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabaseAdmin
      .from('syndicats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un syndicat (bypass RLS avec Service Role Key)
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier que la clé service role est configurée
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key non configurée' },
        { status: 500 }
      );
    }

    // Créer un client admin avec la service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Récupérer l'ID du syndicat à supprimer depuis le body
    const body = await request.json().catch(() => ({}));
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du syndicat manquant' },
        { status: 400 }
      );
    }

    // D'abord, désassocier les chefs de ligne de ce syndicat
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ syndicat_id: null })
      .eq('syndicat_id', id);

    if (updateError) {
      // On continue quand même pour supprimer le syndicat
    }

    // Supprimer le syndicat
    const { error } = await supabaseAdmin
      .from('syndicats')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Syndicat supprimé avec succès'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
