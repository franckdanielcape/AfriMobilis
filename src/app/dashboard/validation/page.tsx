'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './validation.module.css';

interface DocumentAValider {
    id: string;
    vehicule_id: string;
    immatriculation: string;
    type_document: string;
    numero_document?: string;
    date_expiration: string;
    photo_url?: string;
    date_soumission: string;
    selected?: boolean;
}

export default function ValidationPage() {
    const [documents, setDocuments] = useState<DocumentAValider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [validating, setValidating] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        
        // TODO: Récupérer les vrais documents en attente depuis Supabase
        // Pour l'instant, données de démo
        const demoData: DocumentAValider[] = [
            {
                id: '1',
                vehicule_id: 'v1',
                immatriculation: 'AB-123-CD',
                type_document: 'Visite Technique',
                numero_document: 'VT-2024-001',
                date_expiration: '2026-09-15',
                date_soumission: '2026-03-10',
            },
            {
                id: '2',
                vehicule_id: 'v2',
                immatriculation: 'EF-456-GH',
                type_document: 'Visite Technique',
                numero_document: 'VT-2024-002',
                date_expiration: '2026-10-20',
                date_soumission: '2026-03-11',
            },
            {
                id: '3',
                vehicule_id: 'v3',
                immatriculation: 'IJ-789-KL',
                type_document: 'Visite Technique',
                numero_document: 'VT-2024-003',
                date_expiration: '2026-08-30',
                date_soumission: '2026-03-12',
            },
        ];
        
        setDocuments(demoData);
        setLoading(false);
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === documents.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(documents.map(d => d.id)));
        }
    };

    const handleValidation = async () => {
        if (selectedIds.size === 0) return;
        
        setValidating(true);
        
        try {
            // TODO: Mettre à jour les documents dans Supabase
            // await supabase
            //     .from('documents_conformite')
            //     .update({ 
            //         statut: 'valide',
            //         valide_par: userId,
            //         date_validation: new Date().toISOString()
            //     })
            //     .in('id', Array.from(selectedIds));

            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccess(`${selectedIds.size} document(s) validé(s) avec succès`);
            setSelectedIds(new Set());
            fetchDocuments();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Erreur validation:', error);
        } finally {
            setValidating(false);
        }
    };

    const handleRejet = async () => {
        if (selectedIds.size === 0) return;
        
        // TODO: Implémenter le rejet avec motif
        alert('Fonctionnalité de rejet à implémenter avec saisie du motif');
    };

    if (loading) {
        return <div className={styles.loading}>Chargement...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>✅ Validation des Documents</h1>
                    <p className={styles.subtitle}>
                        Validez les visites techniques soumises par les propriétaires
                    </p>
                </div>
            </div>

            {success && (
                <div className={styles.successAlert}>
                    {success}
                </div>
            )}

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{documents.length}</span>
                    <span className={styles.statLabel}>En attente</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{selectedIds.size}</span>
                    <span className={styles.statLabel}>Sélectionnés</span>
                </div>
            </div>

            <div className={styles.toolbar}>
                <label className={styles.selectAll}>
                    <input
                        type="checkbox"
                        checked={selectedIds.size === documents.length && documents.length > 0}
                        onChange={toggleAll}
                    />
                    <span>Tout sélectionner</span>
                </label>

                {selectedIds.size > 0 && (
                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            onClick={handleValidation}
                            disabled={validating}
                        >
                            {validating ? 'Validation...' : `✓ Valider (${selectedIds.size})`}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRejet}
                            disabled={validating}
                        >
                            ✗ Rejeter
                        </Button>
                    </div>
                )}
            </div>

            <div className={styles.documentsList}>
                {documents.length === 0 ? (
                    <div className={styles.empty}>
                        <p>Aucun document en attente de validation</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div
                            key={doc.id}
                            className={`${styles.documentCard} ${selectedIds.has(doc.id) ? styles.selected : ''}`}
                            onClick={() => toggleSelection(doc.id)}
                        >
                            <div className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(doc.id)}
                                    onChange={() => toggleSelection(doc.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>

                            <div className={styles.vehiculeInfo}>
                                <h3>{doc.immatriculation}</h3>
                                <p>{doc.type_document}</p>
                            </div>

                            <div className={styles.documentDetails}>
                                <div className={styles.detail}>
                                    <label>N° Document:</label>
                                    <span>{doc.numero_document || '—'}</span>
                                </div>
                                <div className={styles.detail}>
                                    <label>Date d&apos;expiration:</label>
                                    <span>{new Date(doc.date_expiration).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className={styles.detail}>
                                    <label>Soumis le:</label>
                                    <span>{new Date(doc.date_soumission).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>

                            <div className={styles.preview}>
                                {doc.photo_url ? (
                                    <img src={doc.photo_url} alt="Document" />
                                ) : (
                                    <div className={styles.noPreview}>📄</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
