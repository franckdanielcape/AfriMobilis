// =====================================================
// API ROUTE: Objets Perdus
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface ObjetPerdu {
    id: string;
    categorie: string;
    description: string;
    couleur?: string;
    marque?: string;
    lieu_perte: string;
    date_perte: string;
    statut: 'en_attente' | 'matched' | 'rendu' | 'abandonne';
    date_creation: string;
}

/**
 * GET /api/objets/perdus
 * Liste les objets perdus de l'utilisateur (ou tous pour admin)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        const { data: { session } } = await supabaseAdmin.auth.getSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Vérifier si admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = ['admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin'].includes(profile?.role);

        let query = supabaseAdmin
            .from('vue_objets_perdus')
            .select('*')
            .order('date_creation', { ascending: false });

        // Si pas admin, ne voir que ses propres objets
        if (!isAdmin) {
            query = query.eq('passager_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erreur récupération objets perdus:', error);
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
 * POST /api/objets/perdus
 * Crée un signalement d'objet perdu
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
        if (!session) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            categorie,
            description,
            couleur,
            marque,
            lieu_perte,
            date_perte,
            heure_perte,
            vehicule_immatriculation,
            telephone_contact,
            email_contact,
        } = body;

        // Validation
        if (!categorie || !description || !lieu_perte || !date_perte) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('creer_objet_perdu', {
                p_passager_id: session.user.id,
                p_categorie: categorie,
                p_description: description,
                p_couleur: couleur || null,
                p_marque: marque || null,
                p_lieu_perte: lieu_perte,
                p_date_perte: date_perte,
                p_heure_perte: heure_perte || null,
                p_vehicule_immatriculation: vehicule_immatriculation || null,
                p_telephone_contact: telephone_contact || null,
                p_email_contact: email_contact || null,
            });

        if (error) {
            console.error('Erreur création objet perdu:', error);
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
