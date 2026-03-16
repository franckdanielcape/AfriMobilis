export interface Versement {
    id: string;
    transaction_id?: string;
    affectation_id?: string;
    montant_attendu: number;
    montant_verse: number;
    retard?: boolean;
    date_echeance: Date | string;
    date_paiement?: Date | string;
    statut: 'en_attente' | 'complet' | 'partiel' | 'en_retard';
    commentaire?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateVersementDTO {
    transaction_id?: string;
    affectation_id?: string;
    montant_attendu: number;
    montant_verse?: number;
    date_echeance: Date | string;
    statut?: 'en_attente' | 'complet' | 'partiel' | 'en_retard';
    commentaire?: string;
}
