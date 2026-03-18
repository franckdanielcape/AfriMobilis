import { createClient } from '@supabase/supabase-js';
import type { UserProfile, Vehicule, Chauffeur, Versement, Panne, Document } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helpers
export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
};

export const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: userData,
        },
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};

// Profile helpers
export const getProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data as UserProfile;
};

// Vehicules helpers
export const getVehiculesByProprietaire = async (proprietaireId: string): Promise<Vehicule[]> => {
    const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching vehicules:', error);
        return [];
    }
    return data as Vehicule[] || [];
};

export const getVehiculeById = async (id: string): Promise<Vehicule | null> => {
    const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching vehicule:', error);
        return null;
    }
    return data as Vehicule;
};

// Chauffeurs helpers
export const getChauffeursByProprietaire = async (proprietaireId: string): Promise<Chauffeur[]> => {
    const { data, error } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('proprietaire_id', proprietaireId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching chauffeurs:', error);
        return [];
    }
    return data as Chauffeur[] || [];
};

export const getAffectationsActives = async (vehiculeIds: string[]) => {
    if (vehiculeIds.length === 0) return {};
    
    const { data, error } = await supabase
        .from('affectations')
        .select(`
            vehicule_id,
            date_debut,
            chauffeur:profiles!chauffeur_id(id, nom, prenom, telephone)
        `)
        .in('vehicule_id', vehiculeIds)
        .is('date_fin', null);
    
    if (error) {
        console.error('Error fetching affectations:', error);
        return {};
    }
    
    const affectationsMap: Record<string, any> = {};
    data?.forEach((a: any) => {
        affectationsMap[a.vehicule_id] = a;
    });
    return affectationsMap;
};

// Versements helpers
export const getVersementsByVehicule = async (vehiculeId: string): Promise<Versement[]> => {
    const { data, error } = await supabase
        .from('versements')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('date_versement', { ascending: false });
    
    if (error) {
        console.error('Error fetching versements:', error);
        return [];
    }
    return data as Versement[] || [];
};

export const createVersement = async (versement: Partial<Versement>) => {
    const { data, error } = await supabase
        .from('versements')
        .insert([versement])
        .select()
        .single();
    
    return { data, error };
};

// Pannes helpers
export const getPannesByVehicule = async (vehiculeId: string): Promise<Panne[]> => {
    const { data, error } = await supabase
        .from('pannes')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('date_declaration', { ascending: false });
    
    if (error) {
        console.error('Error fetching pannes:', error);
        return [];
    }
    return data as Panne[] || [];
};

export const createPanne = async (panne: Partial<Panne>) => {
    const { data, error } = await supabase
        .from('pannes')
        .insert([panne])
        .select()
        .single();
    
    return { data, error };
};

// Documents helpers
export const getDocumentsByVehicule = async (vehiculeId: string): Promise<Document[]> => {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('vehicule_id', vehiculeId)
        .order('date_expiration', { ascending: true });
    
    if (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
    return data as Document[] || [];
};

export const uploadDocument = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
        .from('documents')
        .upload(path, file);
    
    return { data, error };
};

export const getDocumentUrl = (path: string) => {
    const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(path);
    
    return data.publicUrl;
};
