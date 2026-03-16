import { supabaseAdmin } from '../../config/supabase';
import { Versement, CreateVersementDTO } from '../../domain/entities/Versement';

export interface IVersementRepository {
    findAll(): Promise<Versement[]>;
    findById(id: string): Promise<Versement | null>;
    create(versement: CreateVersementDTO): Promise<Versement>;
}

export class VersementRepository implements IVersementRepository {
    async findAll(): Promise<Versement[]> {
        const { data, error } = await supabaseAdmin.from('versements').select('*');
        if (error) throw new Error(error.message);
        return data as Versement[];
    }

    async findById(id: string): Promise<Versement | null> {
        const { data, error } = await supabaseAdmin.from('versements').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Versement | null;
    }

    async create(versement: CreateVersementDTO): Promise<Versement> {
        const { data, error } = await supabaseAdmin.from('versements').insert([versement]).select().single();
        if (error) throw new Error(error.message);
        return data as Versement;
    }
}
