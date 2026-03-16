export interface Ticket {
    id: string;
    passager_id?: string;
    type: 'reclamation' | 'assistance' | 'information';
    categorie?: string;
    description: string;
    date_incident?: Date | string;
    lieu?: string;
    vehicule_immatriculation?: string;
    chauffeur_nom?: string;
    preuves?: any;
    statut: 'nouveau' | 'en_cours' | 'attente_client' | 'resolu' | 'ferme';
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    assigne_a?: string;
    resolution_notes?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateTicketDTO {
    passager_id?: string;
    type: 'reclamation' | 'assistance' | 'information';
    categorie?: string;
    description: string;
    date_incident?: Date | string;
    lieu?: string;
    vehicule_immatriculation?: string;
    chauffeur_nom?: string;
    statut?: 'nouveau' | 'en_cours' | 'attente_client' | 'resolu' | 'ferme';
    priorite?: 'basse' | 'normale' | 'haute' | 'urgente';
}
