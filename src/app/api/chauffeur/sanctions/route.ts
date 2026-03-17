// =====================================================
// API ROUTE: Sanctions du Chauffeur (lecture seule)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface Sanction {
    id: string;
    type_sanction: 'avertissement' | 'legere' | 'lourde' | 'suspension';
    motif: string;
    description?: string;
    statut: 'en_attente' | 'valide' | 'annule';
    date_incident: string;
    date_creation: string;
    vehicule_immatriculation?: string;
    agent_prenom?: string;
    agent_nom?: string;
}

/**
 * GET /api/chauffeur/sanctions
 * Récupère les sanctions du chauffeur connecté (lecture seule)
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

        // Vérifier que l'utilisateur est bien un chauffeur
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (!profile || profile.role !== 'chauffeur') {
            return NextResponse.json(
                { error: 'Accès réservé aux chauffeurs' },
                { status: 403 }
            );
        }

        // Récupérer les sanctions du chauffeur
        const { data, error } = await supabaseAdmin
            .from('vue_sanctions_complets')
            .select('*')
            .eq('chauffeur_id', userId)
            .order('date_creation', { ascending: false });

        if (error) {
            console.error('Erreur récupération sanctions:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération' },
                { status: 500 }
            );
        }

        // Formater les données
        const sanctions: Sanction[] = (data || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            type_sanction: s.type_sanction as Sanction['type_sanction'],
            motif: s.motif as string,
            description: s.description as string | undefined,
            statut: s.statut as Sanction['statut'],
            date_incident: s.date_incident as string,
            date_creation: s.date_creation as string,
            vehicule_immatriculation: s.vehicule_immatriculation as string | undefined,
            agent_prenom: s.agent_prenom as string | undefined,
            agent_nom: s.agent_nom as string | undefined,
        }));

        return NextResponse.json({ sanctions });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
