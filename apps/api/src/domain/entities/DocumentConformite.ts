export interface DocumentConformite {
    id: string;
    vehicule_id: string;
    type_document: string;
    numero_document?: string;
    date_expiration: Date | string;
    statut?: 'valide' | 'bientot' | 'urgent' | 'expire';
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateDocumentConformiteDTO {
    vehicule_id: string;
    type_document: string;
    numero_document?: string;
    date_expiration: Date | string;
}
