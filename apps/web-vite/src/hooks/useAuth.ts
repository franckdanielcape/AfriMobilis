import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser, getProfile, signIn as sbSignIn, signOut as sbSignOut } from '../lib/supabase';
import type { UserProfile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check current session
        const checkUser = async () => {
            try {
                const { user: authUser, error: authError } = await getCurrentUser();
                
                if (authError || !authUser) {
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const profile = await getProfile(authUser.id);
                setUser(profile);
            } catch (err) {
                console.error('Auth error:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await getProfile(session.user.id);
                setUser(profile);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        
        const { data, error } = await sbSignIn(email, password);
        
        if (error) {
            setError(error.message);
            setLoading(false);
            return { success: false, error: error.message };
        }

        if (data.user) {
            const profile = await getProfile(data.user.id);
            setUser(profile);
        }
        
        setLoading(false);
        return { success: true, error: null };
    }, []);

    const signOut = useCallback(async () => {
        setLoading(true);
        const { error } = await sbSignOut();
        
        if (error) {
            setError(error.message);
        } else {
            setUser(null);
        }
        
        setLoading(false);
        return { error };
    }, []);

    const hasRole = useCallback((roles: string[]) => {
        return user ? roles.includes(user.role) : false;
    }, [user]);

    return {
        user,
        loading,
        error,
        signIn,
        signOut,
        hasRole,
        isAuthenticated: !!user,
    };
};

export default useAuth;
