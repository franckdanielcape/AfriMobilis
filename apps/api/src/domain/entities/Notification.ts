export interface Notification {
    id: string;
    profil_id: string;
    titre: string;
    message: string;
    type: 'alerte_document' | 'rappel_versement' | 'information' | 'nouveau_ticket' | 'affectation';
    lu: boolean;
    lien_action?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateNotificationDTO {
    profil_id: string;
    titre: string;
    message: string;
    type: 'alerte_document' | 'rappel_versement' | 'information' | 'nouveau_ticket' | 'affectation';
    lien_action?: string;
}
