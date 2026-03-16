import { supabaseAdmin } from '../../config/supabase';
import { Vehicle, CreateVehicleDTO } from '../../domain/entities/Vehicle';

export interface IVehicleRepository {
    findAll(): Promise<Vehicle[]>;
    findById(id: string): Promise<Vehicle | null>;
    findByPlaque(plaque: string): Promise<Vehicle | null>;
    create(vehicle: CreateVehicleDTO): Promise<Vehicle>;
}

export class VehicleRepository implements IVehicleRepository {
    async findAll(): Promise<Vehicle[]> {
        const { data, error } = await supabaseAdmin.from('vehicules').select('*');
        if (error) throw new Error(error.message);
        return data as Vehicle[];
    }

    async findById(id: string): Promise<Vehicle | null> {
        const { data, error } = await supabaseAdmin.from('vehicules').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Vehicle | null;
    }

    async findByPlaque(plaque: string): Promise<Vehicle | null> {
        // Recherche insensible à la casse et aux espaces
        const normalizedPlaque = plaque.replace(/\s/g, '').toUpperCase();
        const { data, error } = await supabaseAdmin
            .from('vehicules')
            .select(`
                *,
                proprietaire:profiles!proprietaire_id(nom, prenom, telephone),
                chauffeur_actuel:profiles!chauffeur_id(nom, prenom, telephone),
                documents:documents_conformite(*)
            `)
            .ilike('plaque', normalizedPlaque)
            .single();
        if (error) return null;
        return data as Vehicle | null;
    }

    async create(vehicle: CreateVehicleDTO): Promise<Vehicle> {
        const { data, error } = await supabaseAdmin.from('vehicules').insert([vehicle]).select().single();
        if (error) throw new Error(error.message);
        return data as Vehicle;
    }
}
