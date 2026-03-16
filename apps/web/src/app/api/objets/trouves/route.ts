// =====================================================
// API ROUTE: Objets Trouvés
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

/**
 * GET /api/objets/trouves
 * Liste tous les objets trouvés (public)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const statut = searchParams.get('statut');

        let query = supabaseAdmin
            .from('vue_objets_trouves')
            .select('*')
            .order('date_creation', { ascending: false });

        if (statut) {
            query = query.eq('statut', statut);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erreur récupération objets trouvés:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        return NextResponse.json({ objets: data || [] });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/objets/trouves
 * Déclare un objet trouvé
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const { data: { session } } = await supabaseAdmin.auth.getSession();
        
        const body = await request.json();
        const {
            trouve_par_nom,
            trouve_par_telephone,
            categorie,
            description,
            couleur,
            marque,
            lieu_trouve,
            date_trouve,
            heure_trouve,
            vehicule_immatriculation,
            lieu_depose,
        } = body;

        // Validation
        if (!categorie || !description || !lieu_trouve || !date_trouve) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('creer_objet_trouve', {
                p_trouve_par_id: session?.user?.id || null,
                p_trouve_par_nom: trouve_par_nom || null,
                p_trouve_par_telephone: trouve_par_telephone || null,
                p_categorie: categorie,
                p_description: description,
                p_couleur: couleur || null,
                p_marque: marque || null,
                p_lieu_trouve: lieu_trouve,
                p_date_trouve: date_trouve,
                p_heure_trouve: heure_trouve || null,
                p_vehicule_immatriculation: vehicule_immatriculation || null,
                p_lieu_depose: lieu_depose || null,
            });

        if (error) {
            console.error('Erreur création objet trouvé:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la création' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, id: data },
            { status: 201 }
        );
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
