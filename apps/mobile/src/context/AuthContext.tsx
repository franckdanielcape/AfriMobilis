import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../utils/supabase';

interface User {
    id: string;
    email?: string;
    role: string;
    prenom: string;
    nom?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (telephone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            // Vérifier si on a une session stockée
            const sessionData = await SecureStore.getItemAsync('session');
            
            if (sessionData) {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setUser({
                            id: session.user.id,
                            email: session.user.email,
                            role: profile.role,
                            prenom: profile.prenom,
                            nom: profile.nom,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Erreur vérification auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (telephone: string, password: string) => {
        try {
            // Rechercher l'utilisateur par téléphone
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('telephone', telephone)
                .single();

            if (profileError || !profile) {
                throw new Error('Numéro de téléphone non trouvé');
            }

            // Connexion avec email (si disponible) ou créer une session
            const { data, error } = await supabase.auth.signInWithPassword({
                email: profile.email || `${telephone}@afrimobilis.local`,
                password,
            });

            if (error) throw error;

            if (data.user) {
                await SecureStore.setItemAsync('session', JSON.stringify(data.session));
                
                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    role: profile.role,
                    prenom: profile.prenom,
                    nom: profile.nom,
                });
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            await SecureStore.deleteItemAsync('session');
            setUser(null);
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé dans AuthProvider');
    }
    return context;
}
