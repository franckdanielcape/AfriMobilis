// =====================================================
// API ROUTE: Admin - Gestion des Tickets (Workflow)
// GET: Liste tous les tickets avec filtres
// PATCH: Changer statut d'un ticket
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface Ticket {
    id: string;
    type: string;
    description: string;
    statut: 'soumis' | 'en_cours' | 'resolu' | 'rejete';
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    lieu?: string;
    date_incident?: string;
    date_creation: string;
    date_ouverture?: string;
    date_resolution?: string;
    passager_id: string;
    passager_prenom?: string;
    passager_nom?: string;
    passager_email?: string;
    passager_telephone?: string;
    traite_par?: string;
    agent_prenom?: string;
    agent_nom?: string;
    nb_commentaires: number;
}

/**
 * GET /api/tickets/admin
 * Récupère tous les tickets (pour admin) avec filtres
 * Query params:
 *   - statut: filtrer par statut
 *   - priorite: filtrer par priorité
 *   - type: filtrer par type
 *   - page: pagination
 *   - limit: limite par page
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
            .select('role, ville_id')
            .eq('id', userId)
            .single();

        if (!profile || !['admin_syndicat', 'chef_ligne', 'super_chef_de_ligne', 'super_admin'].includes(profile.role)) {
            return NextResponse.json(
                { error: 'Accès refusé' },
                { status: 403 }
            );
        }

        // Query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const statutFilter = searchParams.get('statut');
        const prioriteFilter = searchParams.get('priorite');
        const typeFilter = searchParams.get('type');

        // Construire la requête
        let query = supabaseAdmin
            .from('vue_tickets_complets')
            .select('*', { count: 'exact' })
            .order('date_creation', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // Filtres
        if (statutFilter) {
            query = query.eq('statut', statutFilter);
        }
        if (prioriteFilter) {
            query = query.eq('priorite', prioriteFilter);
        }
        if (typeFilter) {
            query = query.eq('type', typeFilter);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Erreur récupération tickets:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            tickets: data || [],
            total: count || 0,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/tickets/admin
 * Change le statut d'un ticket
 * Body:
 *   - ticket_id: ID du ticket
 *   - statut: nouveau statut (en_cours, resolu, rejete)
 *   - notes: notes de résolution (optionnel)
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
        const { ticket_id, statut, notes } = body;

        // Validation
        if (!ticket_id || !statut) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        const allowedStatuts = ['en_cours', 'resolu', 'rejete'];
        if (!allowedStatuts.includes(statut)) {
            return NextResponse.json(
                { error: 'Statut invalide' },
                { status: 400 }
            );
        }

        // Utiliser la fonction RPC pour changer le statut
        const { data, error } = await supabaseAdmin
            .rpc('changer_statut_ticket', {
                p_ticket_id: ticket_id,
                p_nouveau_statut: statut,
                p_agent_id: userId,
                p_notes: notes || null,
            });

        if (error) {
            console.error('Erreur changement statut:', error);
            return NextResponse.json(
                { error: 'Erreur lors du changement de statut' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Ticket non trouvé ou accès refusé' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, statut });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tickets/admin
 * Ajoute un commentaire à un ticket
 * Body:
 *   - ticket_id: ID du ticket
 *   - message: contenu du commentaire
 *   - type: type de commentaire (commentaire, interne)
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
        const { ticket_id, message, type = 'commentaire' } = body;

        if (!ticket_id || !message) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .rpc('ajouter_commentaire_ticket', {
                p_ticket_id: ticket_id,
                p_auteur_id: userId,
                p_message: message,
                p_type: type,
            });

        if (error) {
            console.error('Erreur ajout commentaire:', error);
            return NextResponse.json(
                { error: 'Erreur lors de l\'ajout du commentaire' },
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
