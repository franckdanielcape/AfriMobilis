// =====================================================
// API ROUTE: Stats des tickets (pour dashboard admin)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface TicketStats {
    total: number;
    soumis: number;
    en_cours: number;
    resolus: number;
    rejetés: number;
    urgents: number;
}

/**
 * GET /api/tickets/stats
 * Retourne les statistiques des tickets
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

        // Utiliser la fonction RPC pour les stats
        const { data, error } = await supabaseAdmin
            .rpc('get_stats_tickets', {
                p_ville_id: profile.ville_id || null,
            });

        if (error) {
            console.error('Erreur stats tickets:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des stats' },
                { status: 500 }
            );
        }

        const stats: TicketStats = data?.[0] || {
            total: 0,
            soumis: 0,
            en_cours: 0,
            resolus: 0,
            rejetés: 0,
            urgents: 0,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
