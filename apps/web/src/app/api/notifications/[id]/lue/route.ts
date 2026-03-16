import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

interface RouteParams {
    params: {
        id: string;
    };
}

/**
 * PATCH /api/notifications/:id/lue
 * Marque une notification comme lue
 */
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
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

        const notificationId = params.id;

        // Utiliser la fonction RPC pour marquer comme lue
        const { data, error } = await supabaseAdmin
            .rpc('marquer_notification_lue', {
                p_notification_id: notificationId,
                p_user_id: userId,
            });

        if (error) {
            console.error('Erreur marquage notification:', error);
            return NextResponse.json(
                { error: 'Erreur lors du marquage' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Notification non trouvée ou non autorisée' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, lue: true });
    } catch (error) {
        console.error('Erreur inattendue:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
