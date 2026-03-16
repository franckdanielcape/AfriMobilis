'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

interface AuthGuardOptions {
    requiredRole?: string | string[];
    redirectTo?: string;
}

/**
 * Hook pour protéger une page ou une section
 * Redirige vers login si l'utilisateur n'est pas authentifié
 * Optionnellement vérifie un rôle spécifique
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
    const { requiredRole, redirectTo = '/login' } = options;
    const router = useRouter();
    const pathname = usePathname();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    interface User {
        id: string;
        email?: string;
        user_metadata?: Record<string, unknown>;
    }
    interface Profile {
        id: string;
        role: string;
        nom?: string;
        prenom?: string;
        syndicat_id?: string;
    }
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Vérifier la session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    // Pas de session, rediriger vers login
                    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
                    router.push(redirectUrl);
                    return;
                }

                // Récupérer le profil
                const { data: userProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError || !userProfile) {
                    await supabase.auth.signOut();
                    router.push(redirectTo);
                    return;
                }

                // Vérifier le rôle si requis
                if (requiredRole) {
                    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
                    if (!roles.includes(userProfile.role)) {
                        router.push('/dashboard?error=unauthorized');
                        return;
                    }
                }

                setUser(session.user);
                setProfile(userProfile);
                setIsAuthenticated(true);
            } catch {
                router.push(redirectTo);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false);
                setUser(null);
                setProfile(null);
                router.push(redirectTo);
            }
        });

        return () => subscription.unsubscribe();
    }, [router, pathname, redirectTo, requiredRole]);

    return { isLoading, isAuthenticated, user, profile };
}

/**
 * Hook pour les composants qui ont besoin de savoir si l'utilisateur est connecté
 * mais qui ne redirigent pas automatiquement
 */
export function useAuth() {
    interface User {
        id: string;
        email?: string;
        user_metadata?: Record<string, unknown>;
    }
    interface Profile {
        id: string;
        role: string;
        nom?: string;
        prenom?: string;
        syndicat_id?: string;
    }
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                setUser(session.user);
                const { data: userProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setProfile(userProfile);
            }
            
            setIsLoading(false);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setUser(session.user);
                supabase.from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data }) => setProfile(data));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return { user, profile, isLoading, signOut, isAuthenticated: !!user };
}
