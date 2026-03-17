// =====================================================
// API ROUTE: Gestion d'un contrôle spécifique
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Récupérer un contrôle par ID
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
            .from('vue_controles_complets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Contrôle non trouvé' },
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

// PATCH - Modifier un contrôle
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

        // Vérifier que le contrôle existe
        const { data: existingControl, error: checkError } = await supabaseAdmin
            .from('controles')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existingControl) {
            return NextResponse.json(
                { error: 'Contrôle non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier le résultat si fourni
        if (body.resultat) {
            const validResults = ['conforme', 'non_conforme', 'avertissement'];
            if (!validResults.includes(body.resultat)) {
                return NextResponse.json(
                    { error: 'Résultat invalide' },
                    { status: 400 }
                );
            }
        }

        // Prparer les données à mettre à jour
        const updateData: Record<string, unknown> = {};
        
        if (body.date_controle !== undefined) updateData.date_controle = body.date_controle;
        if (body.lieu !== undefined) updateData.lieu = body.lieu;
        if (body.resultat !== undefined) updateData.resultat = body.resultat;
        if (body.note !== undefined) updateData.note = body.note;
        if (body.preuves !== undefined) updateData.preuves = body.preuves;
        if (body.conformite_documents !== undefined) updateData.conformite_documents = body.conformite_documents;
        if (body.conformite_plaque !== undefined) updateData.conformite_plaque = body.conformite_plaque;
        if (body.conformite_assurance !== undefined) updateData.conformite_assurance = body.conformite_assurance;
        if (body.conformite_carte_stationnement !== undefined) updateData.conformite_carte_stationnement = body.conformite_carte_stationnement;
        if (body.conformite_visite_technique !== undefined) updateData.conformite_visite_technique = body.conformite_visite_technique;

        const { data, error } = await supabaseAdmin
            .from('controles')
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
            message: 'Contrôle mis à jour avec succès',
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

// DELETE - Supprimer un contrôle
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

        // Vérifier que le contrôle existe
        const { data: existingControl, error: checkError } = await supabaseAdmin
            .from('controles')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !existingControl) {
            return NextResponse.json(
                { error: 'Contrôle non trouvé' },
                { status: 404 }
            );
        }

        const { error } = await supabaseAdmin
            .from('controles')
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
            message: 'Contrôle supprimé avec succès'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
