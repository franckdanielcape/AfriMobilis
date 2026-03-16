// =====================================================
// API ROUTE: Gestion d'une sanction spécifique
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Récupérer une sanction par ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        const { data, error } = await supabaseAdmin
            .from('vue_sanctions_complets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Sanction non trouvée' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// PATCH - Modifier une sanction (validation ou mise à jour)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;
        const body = await request.json();

        // Vérifier que la sanction existe
        const { data: existingSanction, error: checkError } = await supabaseAdmin
            .from('sanctions')
            .select('id, statut')
            .eq('id', id)
            .single();

        if (checkError || !existingSanction) {
            return NextResponse.json(
                { error: 'Sanction non trouvée' },
                { status: 404 }
            );
        }

        // Préparer les données à mettre à jour
        const updateData: Record<string, unknown> = {};
        
        if (body.motif !== undefined) updateData.motif = body.motif;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.date_incident !== undefined) updateData.date_incident = body.date_incident;
        if (body.preuves !== undefined) updateData.preuves = body.preuves;
        
        // Validation de la sanction
        if (body.statut !== undefined) {
            const validStatuses = ['en_attente', 'valide', 'annule'];
            if (!validStatuses.includes(body.statut)) {
                return NextResponse.json(
                    { error: 'Statut invalide' },
                    { status: 400 }
                );
            }
            updateData.statut = body.statut;
            
            // Si validation, enregistrer qui valide et quand
            if (body.statut === 'valide' || body.statut === 'annule') {
                updateData.valide_par = body.valide_par;
                updateData.date_validation = new Date().toISOString();
            }
        }

        const { data, error } = await supabaseAdmin
            .from('sanctions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sanction mise à jour avec succès',
            data
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Supprimer une sanction
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { id } = params;

        // Vérifier que la sanction existe
        const { data: existingSanction, error: checkError } = await supabaseAdmin
            .from('sanctions')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existingSanction) {
            return NextResponse.json(
                { error: 'Sanction non trouvée' },
                { status: 404 }
            );
        }

        const { error } = await supabaseAdmin
            .from('sanctions')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Sanction supprimée avec succès'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
