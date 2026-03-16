/**
 * Client API pour AfriMobilis
 * Gère automatiquement l'ajout du token d'authentification
 * et la redirection en cas d'erreur 401
 */

import { supabase } from '@/utils/supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions extends RequestInit {
    requireAuth?: boolean;
    redirectOnAuthError?: boolean;
}

/**
 * Classe d'erreur API personnalisée
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public data?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }

    isAuthError(): boolean {
        return this.statusCode === 401;
    }

    isForbidden(): boolean {
        return this.statusCode === 403;
    }
}

/**
 * Gère la déconnexion et redirection en cas d'erreur 401
 */
async function handleAuthError() {
    // Supprimer la session
    await supabase.auth.signOut();
    
    // Rediriger vers la page de login avec le paramètre de redirection
    if (typeof window !== 'undefined') {
        const currentPath = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentPath}&reason=session_expired`;
    }
}

/**
 * Effectue une requête API avec gestion automatique du token
 */
export async function apiClient(
    endpoint: string,
    options: ApiOptions = {}
): Promise<unknown> {
    const { 
        requireAuth = true, 
        redirectOnAuthError = true,
        ...fetchOptions 
    } = options;
    
    // Préparer les headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    // Ajouter le token si auth requise
    if (requireAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        // Gérer les erreurs HTTP
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Erreur 401 - Session expirée ou invalide
            if (response.status === 401 && redirectOnAuthError) {
                await handleAuthError();
                throw new ApiError(
                    'Session expirée. Veuillez vous reconnecter.',
                    response.status,
                    errorData
                );
            }

            // Erreur 403 - Permissions insuffisantes
            if (response.status === 403) {
                if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard?error=unauthorized';
                }
            }

            throw new ApiError(
                errorData.error || `Erreur ${response.status}`,
                response.status,
                errorData
            );
        }

        // Retourner JSON ou null selon le content-type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return null;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            error instanceof Error ? error.message : 'Erreur réseau',
            0
        );
    }
}

// Helpers pratiques
export const api = {
    get: (endpoint: string, options?: ApiOptions) =>
        apiClient(endpoint, { ...options, method: 'GET' }),
    
    post: (endpoint: string, body: Record<string, unknown> | unknown, options?: ApiOptions) =>
        apiClient(endpoint, { 
            ...options, 
            method: 'POST', 
            body: JSON.stringify(body) 
        }),
    
    patch: (endpoint: string, body: Record<string, unknown> | unknown, options?: ApiOptions) =>
        apiClient(endpoint, { 
            ...options, 
            method: 'PATCH', 
            body: JSON.stringify(body) 
        }),
    
    delete: (endpoint: string, options?: ApiOptions) =>
        apiClient(endpoint, { ...options, method: 'DELETE' }),
};
