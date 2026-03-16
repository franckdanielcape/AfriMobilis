// =====================================================
// API ROUTE: Gestion des Sanctions
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Récupérer les sanctions (avec filtres)
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
        const vehiculeId = searchParams.get('vehicule_id');
        const chauffeurId = searchParams.get('chauffeur_id');
        const villeId = searchParams.get('ville_id');
        const statut = searchParams.get('statut');
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabaseAdmin
            .from('vue_sanctions_complets')
            .select('*')
            .order('date_creation', { ascending: false });

        if (vehiculeId) {
            query = query.eq('vehicule_id', vehiculeId);
        }
        if (chauffeurId) {
            query = query.eq('chauffeur_id', chauffeurId);
        }
        if (villeId) {
            query = query.eq('ville_id', villeId);
        }
        if (statut) {
            query = query.eq('statut', statut);
        }
        if (type) {
            query = query.eq('type', type);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Erreur GET sanctions:', error);
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

// POST - Créer une nouvelle sanction
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
        const requiredFields = ['vehicule_id', 'type', 'motif', 'cree_par'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Champ requis manquant: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Vérifier que le type est valide
        const validTypes = ['avertissement', 'legere', 'lourde', 'suspension'];
        if (!validTypes.includes(body.type_sanction)) {
            return NextResponse.json(
                { error: 'Type invalide. Valeurs acceptées: avertissement, legere, lourde, suspension' },
                { status: 400 }
            );
        }

        const insertData = {
            vehicule_id: body.vehicule_id,
            chauffeur_id: body.chauffeur_id || null,
            type_sanction: body.type_sanction,
            motif: body.motif,
            description: body.description || null,
            statut: 'en_attente',
            cree_par: body.cree_par,
            valide_par: null,
            date_incident: body.date_incident || new Date().toISOString(),
            preuves: body.preuves || []
        };

        const { data, error } = await supabaseAdmin
            .from('sanctions')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Erreur POST sanction:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sanction créée avec succès',
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
