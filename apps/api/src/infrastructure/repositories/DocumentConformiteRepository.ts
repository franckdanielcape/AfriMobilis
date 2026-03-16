import { supabaseAdmin } from '../../config/supabase';
import { DocumentConformite, CreateDocumentConformiteDTO } from '../../domain/entities/DocumentConformite';

export interface IDocumentConformiteRepository {
    findAll(): Promise<DocumentConformite[]>;
    findByVehiculeId(vehiculeId: string): Promise<DocumentConformite[]>;
    create(document: CreateDocumentConformiteDTO): Promise<DocumentConformite>;
}

export class DocumentConformiteRepository implements IDocumentConformiteRepository {
    async findAll(): Promise<DocumentConformite[]> {
        const { data, error } = await supabaseAdmin.from('documents_conformite').select('*');
        if (error) throw new Error(error.message);
        return data as DocumentConformite[];
    }

    async findByVehiculeId(vehiculeId: string): Promise<DocumentConformite[]> {
        const { data, error } = await supabaseAdmin.from('documents_conformite').select('*').eq('vehicule_id', vehiculeId);
        if (error) throw new Error(error.message);
        return data as DocumentConformite[];
    }

    async create(document: CreateDocumentConformiteDTO): Promise<DocumentConformite> {
        const { data, error } = await supabaseAdmin.from('documents_conformite').insert([document]).select().single();
        if (error) throw new Error(error.message);
        return data as DocumentConformite;
    }
}
