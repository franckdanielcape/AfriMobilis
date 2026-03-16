import cron from 'node-cron';

export const setupCronJobs = () => {
    // Toutes les heures : Vérification conformité documents
    cron.schedule('0 * * * *', () => {
        console.log('[CRON] Vérification de la conformité des documents des véhicules...');
        // Logique pour vérifier les dates d'expiration et mettre à jour `conformite_status` ou envoyer avertissement
    });

    // Tous les jours 8h : Rappels versements
    cron.schedule('0 8 * * *', () => {
        console.log('[CRON] Envoi des rappels de versements...');
        // Logique pour trouver les chauffeurs en retard ou devant payer aujourd'hui
    });

    // Tous les jours 23h : Rapports journaliers
    cron.schedule('0 23 * * *', () => {
        console.log('[CRON] Génération des rapports journaliers...');
        // Agréger les versements/transactions de la journée pour dashboard
    });

    // Tous les jours 1h : Backup données
    cron.schedule('0 1 * * *', () => {
        console.log('[CRON] Démarrage du backup des données...');
        // Export data or verify Supabase PITR
    });

    console.log('[CRON] Scheduled jobs initialized.');
};
