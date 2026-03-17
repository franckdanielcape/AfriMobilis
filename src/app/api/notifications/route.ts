import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Créer le client admin si la clé existe
const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

// Types
interface Notification {
    id: string;
    type: 'conformite' | 'versement' | 'sanction' | 'ticket' | 'panne' | 'controle' | 'system';
    niveau: 'info' | 'warning' | 'urgent';
    titre: string;
    message: string;
    lien?: string;
    reference_type?: string;
    reference_id?: string;
    lue: boolean;
    date_lecture?: string;
    date_creation: string;
    created_by?: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    nonLues: number;
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * GET /api/notifications
 * Récupère les notifications de l'utilisateur connecté
 * Query params:
 *   - page: numéro de page (default: 1)
 *   - limit: nombre par page (default: 20)
 *   - lue: filter par statut 'true', 'false', 'all' (default: 'all')
 *   - type: filter par type
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Service Role Key non configurée' },
                { status: 500 }
            );
        }

        // Récupérer l'utilisateur depuis le header (middleware auth)
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const lueFilter = searchParams.get('lue');
        const typeFilter = searchParams.get('type');

        // Construire la requête
        let query = supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('date_creation', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // Filtre par statut de lecture
        if (lueFilter === 'true') {
            query = query.eq('lue', true);
        } else if (lueFilter === 'false') {
            query = query.eq('lue', false);
        }

        // Filtre par type
        if (typeFilter) {
            query = query.eq('type', typeFilter);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Erreur récupération notifications:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des notifications' },
                { status: 500 }
            );
        }

        // Compter les non lues
        const { data: countData, error: countError } = await supabaseAdmin
            .rpc('compter_notifications_non_lues', { p_user_id: userId });

        if (countError) {
            console.error('Erreur comptage notifications:', countError);
        }

        const response: NotificationsResponse = {
            notifications: data || [],
            total: count || 0,
            nonLues: countData?.[0]?.total || 0,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications
 * Crée une notification (réservé aux admins et système)
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
        const {
            target_user_id,
            type,
            niveau,
            titre,
            message,
            lien,
            reference_type,
            reference_id,
            metadata,
        } = body;

        // Validation
        if (!target_user_id || !type || !titre || !message) {
            return NextResponse.json(
                { error: 'Champs obligatoires manquants' },
                { status: 400 }
            );
        }

        // Types autorisés
        const allowedTypes = ['conformite', 'versement', 'sanction', 'ticket', 'panne', 'controle', 'system'];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Type de notification invalide' },
                { status: 400 }
            );
        }

        // Créer la notification
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: target_user_id,
                type,
                niveau: niveau || 'info',
                titre,
                message,
                lien,
                reference_type,
                reference_id,
                created_by: userId,
                metadata,
            })
            .select()
            .single();

        if (error) {
            console.error('Erreur création notification:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la création' },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
