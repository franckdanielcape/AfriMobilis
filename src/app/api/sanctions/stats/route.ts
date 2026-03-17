// =====================================================
// API ROUTE: Statistiques des sanctions
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Statistiques des sanctions par ville
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const villeId = searchParams.get('ville_id');

        if (!villeId) {
            return NextResponse.json(
                { error: 'Paramètre ville_id requis' },
                { status: 400 }
            );
        }

        // Utiliser la fonction SQL pour les stats globales
        const { data: statsGlobales, error: statsError } = await supabaseAdmin
            .rpc('get_stats_sanctions', { p_ville_id: villeId });

        if (statsError) {
            console.error('Erreur stats sanctions:', statsError);
            return NextResponse.json(
                { error: statsError.message },
                { status: 500 }
            );
        }

        // Récupérer les sanctions en attente de validation
        const { data: enAttente, error: attenteError } = await supabaseAdmin
            .from('vue_sanctions_complets')
            .select('*')
            .eq('ville_id', villeId)
            .eq('statut', 'en_attente')
            .order('date_creation', { ascending: false })
            .limit(10);

        if (attenteError) {
            console.error('Erreur sanctions en attente:', attenteError);
        }

        return NextResponse.json({
            success: true,
            stats: {
                globales: statsGlobales?.[0] || {
                    total_sanctions: 0,
                    en_attente: 0,
                    validees: 0,
                    annulees: 0,
                    avertissements: 0,
                    legeres: 0,
                    lourdes: 0,
                    suspensions: 0
                }
            },
            validations_en_attente: enAttente || []
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
