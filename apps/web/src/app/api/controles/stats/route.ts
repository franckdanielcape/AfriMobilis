// =====================================================
// API ROUTE: Statistiques des contrôles
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Statistiques des contrôles par ville
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
        const periode = searchParams.get('periode') || '30'; // jours par défaut

        if (!villeId) {
            return NextResponse.json(
                { error: 'Paramètre ville_id requis' },
                { status: 400 }
            );
        }

        const jours = parseInt(periode);

        // Utiliser la fonction SQL pour les stats globales
        const { data: statsGlobales, error: statsError } = await supabaseAdmin
            .rpc('get_stats_controles', { p_ville_id: villeId });

        if (statsError) {
            console.error('Erreur stats controles:', statsError);
            return NextResponse.json(
                { error: statsError.message },
                { status: 500 }
            );
        }

        // Récupérer les stats par agent
        const { data: statsAgents, error: agentsError } = await supabaseAdmin
            .from('vue_controles_complets')
            .select('agent_id, agent_nom, agent_prenom, resultat, date_controle')
            .eq('ville_id', villeId)
            .gte('date_controle', new Date(Date.now() - jours * 24 * 60 * 60 * 1000).toISOString());

        if (agentsError) {
            console.error('Erreur stats agents:', agentsError);
        }

        // Agréger les stats par agent
        const agentsStats = statsAgents?.reduce((acc: Record<string, unknown>, curr) => {
            const key = curr.agent_id;
            if (!acc[key]) {
                acc[key] = {
                    agent_id: curr.agent_id,
                    agent_nom: `${curr.agent_prenom} ${curr.agent_nom}`,
                    total: 0,
                    conformes: 0,
                    non_conformes: 0,
                    avertissements: 0
                };
            }
            acc[key].total++;
            if (curr.resultat === 'conforme') acc[key].conformes++;
            if (curr.resultat === 'non_conforme') acc[key].non_conformes++;
            if (curr.resultat === 'avertissement') acc[key].avertissements++;
            return acc;
        }, {});

        // Récupérer les derniers contrôles
        const { data: derniersControles, error: derniersError } = await supabaseAdmin
            .from('vue_controles_complets')
            .select('*')
            .eq('ville_id', villeId)
            .order('date_controle', { ascending: false })
            .limit(5);

        if (derniersError) {
            console.error('Erreur derniers controles:', derniersError);
        }

        return NextResponse.json({
            success: true,
            stats: {
                globales: statsGlobales?.[0] || {
                    total_controles: 0,
                    conformes: 0,
                    non_conformes: 0,
                    avertissements: 0,
                    taux_conformite: 0
                },
                agents: Object.values(agentsStats || {}),
                periode: jours
            },
            derniers_controles: derniersControles || []
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
