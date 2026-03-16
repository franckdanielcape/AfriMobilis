// =====================================================
// API ROUTE: Matching Objets Perdus/Trouvés (Admin)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface Correspondance {
    objet_perdu_id: string;
    objet_perdu_description: string;
    objet_perdu_categorie: string;
    objet_perdu_couleur?: string;
    lieu_perte: string;
    date_perte: string;
    passager_id: string;
    passager_prenom?: string;
    passager_nom?: string;
    objet_trouve_id: string;
    objet_trouve_description: string;
    objet_trouve_categorie: string;
    objet_trouve_couleur?: string;
    lieu_trouve: string;
    date_trouve: string;
    score_correspondance: number;
}

/**
 * GET /api/objets/matching
 * Liste les correspondances potentielles (admin)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Vérifier le rôle
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile || !['admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin'].includes(profile.role)) {
            return NextResponse.json(
                { error: 'Accès refusé' },
                { status: 403 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('vue_correspondances_potentielles')
            .select('*')
            .gt('score_correspondance', 30)
            .order('score_correspondance', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Erreur correspondances:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        return NextResponse.json({ correspondances: data || [] });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/objets/matching
 * Match un objet perdu avec un objet trouvé
 * Body:
 *   - objet_perdu_id: ID de l'objet perdu
 *   - objet_trouve_id: ID de l'objet trouvé
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { objet_perdu_id, objet_trouve_id } = body;

        if (!objet_perdu_id || !objet_trouve_id) {
            return NextResponse.json(
                { error: 'IDs des objets requis' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('matcher_objets', {
                p_objet_perdu_id: objet_perdu_id,
                p_objet_trouve_id: objet_trouve_id,
                p_matched_by: userId,
            });

        if (error) {
            console.error('Erreur matching:', error);
            return NextResponse.json(
                { error: 'Erreur lors du matching' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Matching impossible (objets non trouvés ou déjà matchés)' },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/objets/matching
 * Marque un objet comme rendu
 * Body:
 *   - objet_perdu_id: ID de l'objet perdu
 *   - notes: notes de rendu (optionnel)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { objet_perdu_id, notes } = body;

        if (!objet_perdu_id) {
            return NextResponse.json(
                { error: 'ID de l\'objet requis' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('marquer_objet_rendu', {
                p_objet_perdu_id: objet_perdu_id,
                p_rendu_par: userId,
                p_notes: notes || null,
            });

        if (error) {
            console.error('Erreur marquage rendu:', error);
            return NextResponse.json(
                { error: 'Erreur lors du marquage' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Objet non trouvé' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
