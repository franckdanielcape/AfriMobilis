import { supabaseAdmin } from '../../config/supabase';
import { Objet, CreateObjetDTO } from '../../domain/entities/Objet';

export interface IObjetRepository {
    findAll(): Promise<Objet[]>;
    findById(id: string): Promise<Objet | null>;
    create(objet: CreateObjetDTO): Promise<Objet>;
}

export class ObjetRepository implements IObjetRepository {
    async findAll(): Promise<Objet[]> {
        const { data, error } = await supabaseAdmin.from('objets').select('*');
        if (error) throw new Error(error.message);
        return data as Objet[];
    }

    async findById(id: string): Promise<Objet | null> {
        const { data, error } = await supabaseAdmin.from('objets').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Objet | null;
    }

    async create(objet: CreateObjetDTO): Promise<Objet> {
        const { data, error } = await supabaseAdmin.from('objets').insert([objet]).select().single();
        if (error) throw new Error(error.message);
        return data as Objet;
    }
}
