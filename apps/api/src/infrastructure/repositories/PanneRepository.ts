import { supabaseAdmin } from '../../config/supabase';
import { Panne, CreatePanneDTO } from '../../domain/entities/Panne';

export interface IPanneRepository {
    findAll(): Promise<Panne[]>;
    findById(id: string): Promise<Panne | null>;
    create(panne: CreatePanneDTO): Promise<Panne>;
}

export class PanneRepository implements IPanneRepository {
    async findAll(): Promise<Panne[]> {
        const { data, error } = await supabaseAdmin.from('pannes').select('*');
        if (error) throw new Error(error.message);
        return data as Panne[];
    }

    async findById(id: string): Promise<Panne | null> {
        const { data, error } = await supabaseAdmin.from('pannes').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Panne | null;
    }

    async create(panne: CreatePanneDTO): Promise<Panne> {
        const { data, error } = await supabaseAdmin.from('pannes').insert([panne]).select().single();
        if (error) throw new Error(error.message);
        return data as Panne;
    }
}
