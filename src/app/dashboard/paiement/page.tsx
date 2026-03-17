'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { MobileMoneyPayment } from '@/components/Payment';
import { Button } from '@/components/ui';
import styles from './paiement.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
}

export default function PaiementPage() {
    const router = useRouter();
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [selectedVehicule, setSelectedVehicule] = useState<Vehicule | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [historique, setHistorique] = useState<any[]>([]);

    // TODO: Récupérer le numéro du syndicat depuis la config
    const SYNDICAT_PHONE = "07 XX XX XX XX";
    const MONTANT_VISITE = 25000; // FCFA

    useEffect(() => {
        fetchVehicules();
    }, []);

    const fetchVehicules = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vehicules')
            .select('id, immatriculation, marque, modele')
            .limit(10);
        
        if (data) {
            setVehicules(data);
        }
        setLoading(false);
    };

    const handlePaymentSuccess = (reference: string) => {
        // TODO: Enregistrer le paiement dans la base de données
        console.log('Paiement réussi, référence:', reference);
        
        // Rediriger vers la page de conformité pour uploader la carte
        setTimeout(() => {
            router.push('/dashboard/conformite');
        }, 2000);
    };

    if (showPayment && selectedVehicule) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Button variant="secondary" onClick={() => setShowPayment(false)}>
                        ← Retour
                    </Button>
                    <h1>Paiement Visite Technique</h1>
                </div>

                <MobileMoneyPayment
                    montantTotal={MONTANT_VISITE}
                    vehiculeId={selectedVehicule.id}
                    vehiculeInfo={{
                        immatriculation: selectedVehicule.immatriculation,
                        marque: selectedVehicule.marque,
                        modele: selectedVehicule.modele,
                    }}
                    syndicatPhone={SYNDICAT_PHONE}
                    onSuccess={handlePaymentSuccess}
                    onError={(error) => console.error('Erreur paiement:', error)}
                    onCancel={() => setShowPayment(false)}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>💳 Paiement des Frais</h1>
                <p className={styles.subtitle}>
                    Payez les frais de visite technique pour vos véhicules
                </p>
            </div>

            <div className={styles.infoCard}>
                <h3>📋 Informations</h3>
                <ul>
                    <li>Frais de visite technique: <strong>{MONTANT_VISITE.toLocaleString()} FCFA</strong></li>
                    <li>Validité: <strong>6 mois</strong></li>
                    <li>Paiement possible en <strong>acompte</strong> ou <strong>totalité</strong></li>
                    <li>Moyens acceptés: Orange Money, MTN Money, Moov Money, Wave</li>
                </ul>
            </div>

            <h2 className={styles.sectionTitle}>Sélectionnez un véhicule</h2>

            {loading ? (
                <div className={styles.loading}>Chargement...</div>
            ) : (
                <div className={styles.vehiculesGrid}>
                    {vehicules.map((vehicule) => (
                        <div 
                            key={vehicule.id} 
                            className={styles.vehiculeCard}
                            onClick={() => {
                                setSelectedVehicule(vehicule);
                                setShowPayment(true);
                            }}
                        >
                            <div className={styles.vehiculeIcon}>🚗</div>
                            <div className={styles.vehiculeInfo}>
                                <h3>{vehicule.immatriculation}</h3>
                                <p>{vehicule.marque} {vehicule.modele}</p>
                            </div>
                            <div className={styles.vehiculeAction}>
                                <span className={styles.montant}>{MONTANT_VISITE.toLocaleString()} FCFA</span>
                                <Button variant="primary" size="sm">
                                    Payer
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && vehicules.length === 0 && (
                <div className={styles.empty}>
                    <p>Aucun véhicule trouvé.</p>
                    <Button onClick={() => router.push('/dashboard/vehicules')}>
                        Ajouter un véhicule
                    </Button>
                </div>
            )}

            {/* Historique des paiements */}
            <h2 className={styles.sectionTitle}>Historique des paiements</h2>
            <div className={styles.historique}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Véhicule</th>
                            <th>Montant</th>
                            <th>Type</th>
                            <th>Statut</th>
                            <th>Référence</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={6} className={styles.emptyCell}>
                                Aucun paiement effectué récemment
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
