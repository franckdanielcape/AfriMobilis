// =====================================================
// API ROUTE: Rentabilité Propriétaire
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface RentabiliteStats {
    total_vehicules: number;
    vehicules_actifs: number;
    total_versements_attendus: number;
    total_versements_recus: number;
    taux_recouvrement: number;
    nombre_versements_en_retard: number;
    montant_retard: number;
    total_pannes: number;
    pannes_en_cours: number;
    cout_total_pannes: number;
    periode_debut: string;
    periode_fin: string;
}

interface VersementMois {
    mois: string;
    mois_label: string;
    attendus: number;
    recus: number;
    retard: number;
}

interface PerformanceVehicule {
    vehicule_id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    statut: string;
    chauffeur_nom: string;
    total_versements_attendus: number;
    total_versements_recus: number;
    taux_recouvrement: number;
    nb_pannes: number;
    cout_pannes: number;
}

interface PanneType {
    type_panne: string;
    nombre: number;
    cout_total: number;
}

/**
 * GET /api/proprietaire/rentabilite
 * Retourne toutes les stats de rentabilité
 * Query params:
 *   - date_debut: YYYY-MM-DD
 *   - date_fin: YYYY-MM-DD
 *   - mois: nombre de mois pour le graphique (default: 6)
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

        // Vérifier que c'est bien un propriétaire
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile || profile.role !== 'proprietaire') {
            return NextResponse.json(
                { error: 'Accès réservé aux propriétaires' },
                { status: 403 }
            );
        }

        // Query params
        const { searchParams } = new URL(request.url);
        const dateDebut = searchParams.get('date_debut') || undefined;
        const dateFin = searchParams.get('date_fin') || undefined;
        const nombreMois = parseInt(searchParams.get('mois') || '6', 10);

        // 1. Stats globales
        const { data: statsData, error: statsError } = await supabaseAdmin
            .rpc('get_rentabilite_proprietaire', {
                p_proprietaire_id: userId,
                p_date_debut: dateDebut,
                p_date_fin: dateFin,
            });

        if (statsError) {
            console.error('Erreur stats rentabilité:', statsError);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des stats' },
                { status: 500 }
            );
        }

        // 2. Versements par mois (pour graphique)
        const { data: versementsData, error: versementsError } = await supabaseAdmin
            .rpc('get_versements_par_mois', {
                p_proprietaire_id: userId,
                p_nombre_mois: nombreMois,
            });

        if (versementsError) {
            console.error('Erreur versements par mois:', versementsError);
        }

        // 3. Performance par véhicule
        const { data: vehiculesData, error: vehiculesError } = await supabaseAdmin
            .rpc('get_performance_vehicules', {
                p_proprietaire_id: userId,
                p_date_debut: dateDebut,
                p_date_fin: dateFin,
            });

        if (vehiculesError) {
            console.error('Erreur performance véhicules:', vehiculesError);
        }

        // 4. Pannes par type
        const { data: pannesData, error: pannesError } = await supabaseAdmin
            .rpc('get_pannes_par_type', {
                p_proprietaire_id: userId,
                p_date_debut: dateDebut,
                p_date_fin: dateFin,
            });

        if (pannesError) {
            console.error('Erreur pannes par type:', pannesError);
        }

        const stats: RentabiliteStats = statsData?.[0] || {
            total_vehicules: 0,
            vehicules_actifs: 0,
            total_versements_attendus: 0,
            total_versements_recus: 0,
            taux_recouvrement: 0,
            nombre_versements_en_retard: 0,
            montant_retard: 0,
            total_pannes: 0,
            pannes_en_cours: 0,
            cout_total_pannes: 0,
            periode_debut: dateDebut || '',
            periode_fin: dateFin || '',
        };

        return NextResponse.json({
            stats,
            versements_par_mois: versementsData || [],
            performance_vehicules: vehiculesData || [],
            pannes_par_type: pannesData || [],
        });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
