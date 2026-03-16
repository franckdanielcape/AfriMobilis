// =====================================================
// API ROUTE: Stats Objets
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface ObjetsStats {
    perdus_total: number;
    perdus_en_attente: number;
    perdus_matched: number;
    perdus_rendus: number;
    trouves_total: number;
    trouves_en_attente: number;
    trouves_matched: number;
    trouves_rendus: number;
}

/**
 * GET /api/objets/stats
 * Retourne les statistiques des objets
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
            .rpc('get_stats_objets');

        if (error) {
            console.error('Erreur stats objets:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        const stats: ObjetsStats = data?.[0] || {
            perdus_total: 0,
            perdus_en_attente: 0,
            perdus_matched: 0,
            perdus_rendus: 0,
            trouves_total: 0,
            trouves_en_attente: 0,
            trouves_matched: 0,
            trouves_rendus: 0,
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
