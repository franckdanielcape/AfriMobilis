export interface Objet {
    id: string;
    ticket_id?: string;
    type: 'perdu' | 'retrouve';
    description: string;
    categorie?: string;
    date_evenement?: Date | string;
    lieu?: string;
    vehicule_id?: string;
    contact_nom?: string;
    contact_phone?: string;
    objet_match_id?: string;
    statut: 'signale' | 'au_bureau' | 'restitue' | 'archive';
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateObjetDTO {
    ticket_id?: string;
    type: 'perdu' | 'retrouve';
    description: string;
    categorie?: string;
    date_evenement?: Date | string;
    lieu?: string;
    vehicule_id?: string;
    contact_nom?: string;
    contact_phone?: string;
    statut?: 'signale' | 'au_bureau' | 'restitue' | 'archive';
}
