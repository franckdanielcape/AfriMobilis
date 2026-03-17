// =====================================================
// API ROUTE: Gestion des Contrôles Terrain
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Récupérer les contrôles (avec filtres)
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

        // Récupérer les paramètres de requête
        const { searchParams } = new URL(request.url);
        const vehiculeId = searchParams.get('vehicule_id');
        const agentId = searchParams.get('agent_id');
        const villeId = searchParams.get('ville_id');
        const resultat = searchParams.get('resultat');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Construire la requête de base
        let query = supabaseAdmin
            .from('vue_controles_complets')
            .select('*')
            .order('date_controle', { ascending: false });

        // Appliquer les filtres
        if (vehiculeId) {
            query = query.eq('vehicule_id', vehiculeId);
        }
        if (agentId) {
            query = query.eq('agent_id', agentId);
        }
        if (villeId) {
            query = query.eq('ville_id', villeId);
        }
        if (resultat) {
            query = query.eq('resultat', resultat);
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Erreur GET controles:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data || [],
            count: count,
            pagination: {
                limit,
                offset,
                hasMore: data && data.length === limit
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// POST - Créer un nouveau contrôle
export async function POST(request: NextRequest) {
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

        const body = await request.json();

        // Validation des champs requis
        const requiredFields = ['vehicule_id', 'agent_id', 'resultat'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Champ requis manquant: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Vérifier que le résultat est valide
        const validResults = ['conforme', 'non_conforme', 'avertissement'];
        if (!validResults.includes(body.resultat)) {
            return NextResponse.json(
                { error: 'Résultat invalide. Valeurs acceptées: conforme, non_conforme, avertissement' },
                { status: 400 }
            );
        }

        // Préparer les données
        const insertData = {
            vehicule_id: body.vehicule_id,
            agent_id: body.agent_id,
            date_controle: body.date_controle || new Date().toISOString(),
            lieu: body.lieu || null,
            resultat: body.resultat,
            note: body.note || null,
            preuves: body.preuves || [],
            conformite_documents: body.conformite_documents || false,
            conformite_plaque: body.conformite_plaque || false,
            conformite_assurance: body.conformite_assurance || false,
            conformite_carte_stationnement: body.conformite_carte_stationnement || false,
            conformite_visite_technique: body.conformite_visite_technique || false
        };

        const { data, error } = await supabaseAdmin
            .from('controles')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Erreur POST controle:', error);
            // Gérer l'erreur de contrôle unique par jour
            if (error.message.includes('unique_controle_jour')) {
                return NextResponse.json(
                    { error: 'Un contrôle existe déjà pour ce véhicule aujourd\'hui par cet agent' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Contrôle créé avec succès',
            data
        }, { status: 201 });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
