/**
 * Service API pour l'application mobile AfriMobilis
 * Connexion au backend avec retry logic et gestion des erreurs
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

class ApiService {
    private supabase: SupabaseClient;
    private apiBaseUrl: string;

    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: AsyncStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        });
        this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
    }

    get client() {
        return this.supabase;
    }

    /**
     * Requête avec retry automatique
     */
    private async fetchWithRetry(
        url: string,
        options: RequestInit = {},
        retries = 3,
        delay = 1000
    ): Promise<Response> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok && retries > 0) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response;
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1, delay * 2);
            }
            throw error;
        }
    }

    /**
     * Récupérer les versements du chauffeur connecté
     */
    async getVersements(chauffeurId: string) {
        const { data, error } = await this.supabase
            .from('versements')
            .select('*')
            .eq('chauffeur_id', chauffeurId)
            .order('date_versement', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Créer un nouveau versement
     */
    async createVersement(versement: {
        chauffeur_id: string;
        vehicle_id: string;
        montant: number;
        date_versement: string;
    }) {
        const { data, error } = await this.supabase
            .from('versements')
            .insert(versement)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Récupérer les pannes du chauffeur
     */
    async getPannes(chauffeurId: string) {
        const { data, error } = await this.supabase
            .from('pannes')
            .select('*')
            .eq('chauffeur_id', chauffeurId)
            .order('date_declaration', { ascending: false });

        if (error) throw error;
        return data;
    }

    /**
     * Déclarer une panne
     */
    async declarePanne(panne: {
        vehicle_id: string;
        chauffeur_id: string;
        description: string;
        gravite: 'mineure' | 'majeure' | 'critique';
        photos?: string[];
    }) {
        const { data, error } = await this.supabase
            .from('pannes')
            .insert(panne)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Récupérer les notifications
     */
    async getNotifications(userId: string) {
        const { data, error } = await this.supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    }

    /**
     * Marquer une notification comme lue
     */
    async markNotificationAsRead(notificationId: string) {
        const { error } = await this.supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
    }

    /**
     * Récupérer le profil utilisateur
     */
    async getProfile(userId: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Mettre à jour le profil
     */
    async updateProfile(userId: string, updates: any) {
        const { data, error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Upload une photo
     */
    async uploadPhoto(bucket: string, path: string, file: Blob) {
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(path, file);

        if (error) throw error;
        return data;
    }

    /**
     * Récupérer les statistiques du chauffeur
     */
    async getStats(chauffeurId: string) {
        const { data, error } = await this.supabase
            .rpc('get_chauffeur_stats', { chauffeur_id: chauffeurId });

        if (error) throw error;
        return data;
    }
}

export const apiService = new ApiService();
