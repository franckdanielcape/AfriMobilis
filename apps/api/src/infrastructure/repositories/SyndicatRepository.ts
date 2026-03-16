import { supabaseAdmin } from '../../config/supabase';
import { Syndicat, CreateSyndicatDTO } from '../../domain/entities/Syndicat';

export interface ISyndicatRepository {
    findAll(): Promise<Syndicat[]>;
    findById(id: string): Promise<Syndicat | null>;
    create(syndicat: CreateSyndicatDTO): Promise<Syndicat>;
}

export class SyndicatRepository implements ISyndicatRepository {
    async findAll(): Promise<Syndicat[]> {
        const { data, error } = await supabaseAdmin.from('syndicats').select('*');
        if (error) throw new Error(error.message);
        return data as Syndicat[];
    }

    async findById(id: string): Promise<Syndicat | null> {
        const { data, error } = await supabaseAdmin.from('syndicats').select('*').eq('id', id).single();
        if (error) throw new Error(error.message);
        return data as Syndicat | null;
    }

    async create(syndicat: CreateSyndicatDTO): Promise<Syndicat> {
        const { data, error } = await supabaseAdmin.from('syndicats').insert([syndicat]).select().single();
        if (error) throw new Error(error.message);
        return data as Syndicat;
    }
}
