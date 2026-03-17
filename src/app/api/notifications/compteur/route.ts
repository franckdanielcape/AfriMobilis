import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface CountResponse {
    total: number;
    info: number;
    warning: number;
    urgent: number;
}

/**
 * GET /api/notifications/compteur
 * Retourne le nombre de notifications non lues par niveau
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

        const { data, error } = await supabaseAdmin
            .rpc('compter_notifications_non_lues', { p_user_id: userId });

        if (error) {
            console.error('Erreur comptage notifications:', error);
            return NextResponse.json(
                { error: 'Erreur lors du comptage' },
                { status: 500 }
            );
        }

        const result: CountResponse = data?.[0] || { total: 0, info: 0, warning: 0, urgent: 0 };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
