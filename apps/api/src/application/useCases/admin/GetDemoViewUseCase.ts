export class GetDemoViewUseCase {
    async execute(role: string): Promise<any> {
        // Return simulated data based on the requested role
        switch (role.toLowerCase()) {
            case 'syndicat':
                return {
                    stats: {
                        vehiculesActifs: 47,
                        alertesConformite: 12,
                        versementsRetard: 5
                    },
                    recents: [
                        { id: 1, action: "Renouvellement assurance validé", date: new Date().toISOString() },
                        { id: 2, action: "Nouveau véhicule GB-1234 enregistré", date: new Date().toISOString() }
                    ]
                };
            case 'proprietaire':
                return {
                    flotte: { total: 3, conformes: 2, alertes: 1 },
                    revenusMensuels: 450000,
                    chauffeurs: [
                        { nom: "Koné Amadou", vehicule: "GB-4422", statut: "À jour" },
                        { nom: "Yao Koffi", vehicule: "GB-1100", statut: "Retard J+2" }
                    ]
                };
            case 'chauffeur':
                return {
                    soldeJour: 12500,
                    versementDu: 8500,
                    coursesDernieres24h: 15,
                    pannes: []
                };
            case 'agent':
                return {
                    controlesDuJour: 24,
                    infractionsRelevees: 3,
                    zoneAssignee: "Gare Routière Sud"
                };
            case 'gerant':
                return {
                    vehiculesGeres: 10,
                    recettesJour: 85000,
                    delegationsActives: 2
                };
            case 'passager':
                return {
                    coursesRecentes: 4,
                    ticketsOuverts: 0,
                    derniereCourse: {
                        date: new Date().toISOString(),
                        depart: "Quartier France",
                        arrivee: "Moossou",
                        prix: 1000
                    }
                };
            default:
                return { message: "Données simulées génériques", role };
        }
    }
}
