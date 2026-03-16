import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Désactiver le refresh automatique pour éviter les boucles réseau
        autoRefreshToken: false,
        // Ne pas persister la session pour éviter les conflits
        persistSession: true,
        // Délai avant de détecter une déconnexion
        detectSessionInUrl: false,
    },
    realtime: {
        // Désactiver le realtime par défaut
        params: {
            eventsPerSecond: 0,
        },
    },
    global: {
        // Ajouter des headers pour éviter le cache
        headers: {
            'Cache-Control': 'no-cache',
        },
    },
    db: {
        // Ne pas charger le schema automatiquement
        schema: 'public',
    },
});

// Fonction utilitaire pour gérer les erreurs réseau de manière sûre
export async function safeSupabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>,
    fallbackValue: T | null = null
): Promise<{ data: T | null; error: Error | null }> {
    try {
        const result = await queryFn();
        return result;
    } catch (err: unknown) {
        // Détection d'erreurs réseau
        if (err.message?.includes('network') || err.message?.includes('fetch') || err.name === 'TypeError') {
            return { 
                data: fallbackValue, 
                error: { message: 'Erreur réseau. Vérifiez votre connexion.', code: 'NETWORK_ERROR' } 
            };
        }
        return { data: fallbackValue, error: err };
    }
}
