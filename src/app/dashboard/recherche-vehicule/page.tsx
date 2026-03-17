'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/utils/supabase/client';
import styles from './recherche.module.css';

interface VehicleResult {
    id: string;
    plaque: string;
    marque?: string;
    modele?: string;
    annee?: number;
    couleur?: string;
    statut: string;
    proprietaire?: {
        nom: string;
        prenom: string;
        telephone: string;
    };
    chauffeur_actuel?: {
        nom: string;
        prenom: string;
        telephone: string;
    };
    documents?: Array<{
        type: string;
        statut: string;
    }>;
}

export default function RechercheVehiculePage() {
    const [plaque, setPlaque] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<VehicleResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!plaque.trim()) {
            setError('Veuillez entrer une plaque d\'immatriculation');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setSearched(true);

        try {
            // Normaliser la plaque (enlever espaces, majuscules)
            const normalizedPlaque = plaque.replace(/\s/g, '').toUpperCase();
            
            // Appel API
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setError('Session expirée. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/vehicles/search/${encodeURIComponent(normalizedPlaque)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            );

            if (response.status === 404) {
                setError(`Aucun véhicule trouvé avec la plaque "${plaque}"`);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erreur lors de la recherche');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
        } finally {
            setLoading(false);
        }
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return 'Non renseigné';
        // Format: +225 XX XX XX XX XX
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
        }
        return phone;
    };

    const getStatutLabel = (statut: string) => {
        const labels: Record<string, string> = {
            'actif': '✅ Actif',
            'en_attente_documents': '⏳ En attente de documents',
            'suspendu': '🚫 Suspendu',
            'non_conforme': '⚠️ Non conforme',
            'en_vente': '🏷️ En vente',
            'vendu': '✓ Vendu'
        };
        return labels[statut] || statut;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔍 Recherche Véhicule</h1>
                <p className={styles.subtitle}>
                    Recherchez un véhicule par sa plaque pour obtenir les informations 
                    du propriétaire et du titulaire. Utile en cas d&apos;incident ou d&apos;infraction.
                </p>
            </div>

            <div className={styles.searchBox}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="plaque">Numéro de plaque</label>
                        <Input
                            id="plaque"
                            type="text"
                            value={plaque}
                            onChange={(e) => setPlaque(e.target.value)}
                            placeholder="Ex: 1234 AB 01"
                            className={styles.searchInput}
                            disabled={loading}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={loading}
                        className={styles.searchButton}
                    >
                        {loading ? 'Recherche...' : '🔍 Rechercher'}
                    </Button>
                </form>
            </div>

            {error && (
                <div className={styles.errorBox}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                        <h2>🚕 {result.plaque}</h2>
                        <span className={`${styles.badge} ${styles[result.statut]}`}>
                            {getStatutLabel(result.statut)}
                        </span>
                    </div>

                    <div className={styles.vehicleInfo}>
                        <h3>📋 Informations du véhicule</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Marque</span>
                                <span className={styles.value}>{result.marque || 'Non renseignée'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Modèle</span>
                                <span className={styles.value}>{result.modele || 'Non renseigné'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Année</span>
                                <span className={styles.value}>{result.annee || 'Non renseignée'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Couleur</span>
                                <span className={styles.value}>{result.couleur || 'Non renseignée'}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.contactsSection}>
                        <h3>👥 Contacts</h3>
                        
                        <div className={styles.contactCard}>
                            <div className={styles.contactHeader}>
                                <span className={styles.contactIcon}>🔑</span>
                                <h4>Propriétaire</h4>
                            </div>
                            {result.proprietaire ? (
                                <div className={styles.contactInfo}>
                                    <p className={styles.contactName}>
                                        {result.proprietaire.prenom} {result.proprietaire.nom}
                                    </p>
                                    <a 
                                        href={`tel:${result.proprietaire.telephone}`}
                                        className={styles.contactPhone}
                                    >
                                        📞 {formatPhone(result.proprietaire.telephone)}
                                    </a>
                                    <div className={styles.contactActions}>
                                        <a 
                                            href={`https://wa.me/${result.proprietaire.telephone?.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.whatsappBtn}
                                        >
                                            💬 WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.noContact}>Propriétaire non renseigné</p>
                            )}
                        </div>

                        <div className={styles.contactCard}>
                            <div className={styles.contactHeader}>
                                <span className={styles.contactIcon}>👨‍✈️</span>
                                <h4>Chauffeur Titulaire Actuel</h4>
                            </div>
                            {result.chauffeur_actuel ? (
                                <div className={styles.contactInfo}>
                                    <p className={styles.contactName}>
                                        {result.chauffeur_actuel.prenom} {result.chauffeur_actuel.nom}
                                    </p>
                                    <a 
                                        href={`tel:${result.chauffeur_actuel.telephone}`}
                                        className={styles.contactPhone}
                                    >
                                        📞 {formatPhone(result.chauffeur_actuel.telephone)}
                                    </a>
                                    <div className={styles.contactActions}>
                                        <a 
                                            href={`https://wa.me/${result.chauffeur_actuel.telephone?.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.whatsappBtn}
                                        >
                                            💬 WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.noContact}>Aucun chauffeur assigné</p>
                            )}
                        </div>
                    </div>

                    {result.documents && result.documents.length > 0 && (
                        <div className={styles.documentsSection}>
                            <h3>📄 Documents de conformité</h3>
                            <div className={styles.documentsList}>
                                {result.documents.map((doc, idx) => (
                                    <div key={idx} className={styles.docItem}>
                                        <span className={styles.docType}>{doc.type}</span>
                                        <span className={`${styles.docStatus} ${styles[doc.statut]}`}>
                                            {doc.statut}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.actionsSection}>
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setPlaque('');
                                setResult(null);
                                setSearched(false);
                            }}
                        >
                            🔄 Nouvelle recherche
                        </Button>
                    </div>
                </div>
            )}

            {!result && !error && !loading && searched && (
                <div className={styles.emptyState}>
                    <p>Aucun résultat trouvé</p>
                </div>
            )}
        </div>
    );
}
