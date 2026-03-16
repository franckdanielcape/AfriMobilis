// =====================================================
// API ROUTE: Gestion des Chefs de Ligne (bypass RLS)
// Utilise la Service Role Key côté serveur
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// POST - Créer un nouveau chef de ligne
export async function POST(request: NextRequest) {
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

    // Récupérer les données du body
    const { nom, prenom, email, syndicat_id, password } = await request.json();
    let { telephone } = await request.json();

    // Validation
    if (!nom || !prenom || !telephone || !syndicat_id || !password) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: nom, prenom, telephone, syndicat_id, password' },
        { status: 400 }
      );
    }

    // Normaliser le numéro de téléphone (ajouter 225 si nécessaire)
    telephone = telephone.replace(/[^0-9]/g, '');
    if (!telephone.startsWith('225')) {
      telephone = '225' + telephone;
    }

    // Vérifier l'unicité du numéro de téléphone (uniquement parmi les chefs actifs)
    const { data: existingPhone, error: _phoneCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, syndicat_id')
      .eq('telephone', telephone)
      .eq('role', 'chef_ligne')  // Uniquement les chefs actifs
      .not('syndicat_id', 'is', null)  // Qui ont un syndicat
      .maybeSingle();

    // Ignorer l'erreur de vérification - on vérifie juste si le téléphone existe

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Ce numéro est déjà utilisé par un chef actif' },
        { status: 400 }
      );
    }

    // Vérifier l'unicité de l'email si fourni (uniquement parmi les actifs)
    if (email) {
      const { data: existingEmail, error: _emailCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .eq('role', 'chef_ligne')
        .maybeSingle();

      // Ignorer l'erreur de vérification

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un chef' },
          { status: 400 }
        );
      }
    }

    // 1. CRÉER L'UTILISATEUR DANS AUTH (avec le mot de passe fourni par l'utilisateur)
    const authEmail = `${telephone}@afrimobilis.local`;
    
    // Création du chef en cours...
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: password,  // Utilise le mot de passe fourni
      email_confirm: true,
      user_metadata: {
        nom,
        prenom,
        telephone,
        role: 'chef_ligne'
      }
    });

    // Si l'utilisateur existe déjà dans Auth, on récupère son ID
    let userId = authData?.user?.id;
    
    if (authError) {
      if (authError.message.includes('already been registered')) {
        // Récupérer l'utilisateur existant
        const { data: existingUsers } = await supabaseAdmin
          .auth
          .admin
          .listUsers();
        
        const existingUser = existingUsers?.users?.find(u => u.email === authEmail);
        if (existingUser) {
          userId = existingUser.id;
        }
      }
      
      if (!userId) {
        return NextResponse.json(
          { error: `Erreur création compte: ${authError.message}` },
          { status: 500 }
        );
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Impossible de créer le compte utilisateur' },
        { status: 500 }
      );
    }

    // 2. CRÉER LE PROFIL (sans email factice)
    const insertData: Record<string, unknown> = {
      id: userId,
      nom,
      prenom,
      telephone,
      role: 'chef_ligne',
      syndicat_id,
      status: 'actif'
    };

    // N'ajouter l'email que si l'utilisateur en a fourni un réel
    if (email && email.trim() !== '') {
      insertData.email = email.trim();
    }
    // Sinon, pas d'email dans le profil (l'utilisateur devra l'ajouter plus tard)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(insertData)
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
      message: 'Chef de Ligne créé avec succès',
      data: {
        ...data,
        tempPassword: password  // Retourne le mot de passe utilisé pour confirmation
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

// GET - Récupérer tous les chefs de ligne ACTIFS (avec syndicat)
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

    // Ne récupérer que les chefs qui ont un syndicat (actifs)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'chef_ligne')
      .not('syndicat_id', 'is', null)  // Uniquement ceux avec un syndicat
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

// PATCH - Modifier un chef de ligne
export async function PATCH(request: NextRequest) {
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

    const { id, nom, prenom, telephone } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID du chef manquant' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ nom, prenom, telephone })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chef de Ligne modifié avec succès'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer définitivement un chef de ligne
export async function DELETE(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const id = body.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du chef manquant' },
        { status: 400 }
      );
    }

    // 1. Supprimer d'abord le compte Auth (pour libérer l'email/téléphone)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (authDeleteError) {
      // On continue quand même pour supprimer le profil
    }

    // 2. Supprimer le profil de la base de données
    const { error } = await supabaseAdmin
      .from('profiles')
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
      message: 'Chef de Ligne supprimé définitivement'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
