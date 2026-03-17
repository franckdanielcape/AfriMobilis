// =====================================================
// API ROUTE: Commentaires d'un ticket
// GET: Liste les commentaires
// POST: Ajoute un commentaire
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface RouteParams {
    params: {
        id: string;
    };
}

interface Commentaire {
    id: string;
    ticket_id: string;
    auteur_id: string;
    auteur_prenom?: string;
    auteur_nom?: string;
    auteur_role?: string;
    message: string;
    type: 'commentaire' | 'changement_statut' | 'resolution' | 'interne';
    ancien_statut?: string;
    nouveau_statut?: string;
    date_creation: string;
}

/**
 * GET /api/tickets/:id/commentaires
 * Récupère les commentaires d'un ticket
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
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

        const ticketId = params.id;

        // Vérifier les permissions
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const isAdmin = ['admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin'].includes(profile?.role);

        // Construire la requête
        let query = supabaseAdmin
            .from('ticket_comments')
            .select(`
                *,
                auteur:auteur_id(prenom, nom, role)
            `)
            .eq('ticket_id', ticketId)
            .eq('supprime', false)
            .order('date_creation', { ascending: true });

        // Les passagers ne voient pas les commentaires internes
        if (!isAdmin) {
            query = query.neq('type', 'interne');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erreur récupération commentaires:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        // Formater les données
        const commentaires: Commentaire[] = (data || []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            ticket_id: c.ticket_id as string,
            auteur_id: c.auteur_id as string,
            auteur_prenom: (c.auteur as Record<string, string>)?.prenom,
            auteur_nom: (c.auteur as Record<string, string>)?.nom,
            auteur_role: (c.auteur as Record<string, string>)?.role,
            message: c.message as string,
            type: c.type as Commentaire['type'],
            ancien_statut: c.ancien_statut as string | undefined,
            nouveau_statut: c.nouveau_statut as string | undefined,
            date_creation: c.date_creation as string,
        }));

        return NextResponse.json({ commentaires });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tickets/:id/commentaires
 * Ajoute un commentaire au ticket
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
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

        const ticketId = params.id;
        const body = await request.json();
        const { message, type = 'commentaire' } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message obligatoire' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('ajouter_commentaire_ticket', {
                p_ticket_id: ticketId,
                p_auteur_id: userId,
                p_message: message,
                p_type: type,
            });

        if (error) {
            console.error('Erreur ajout commentaire:', error);
            return NextResponse.json(
                { error: 'Erreur lors de l\'ajout' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Accès refusé' },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true, comment_id: data }, { status: 201 });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
