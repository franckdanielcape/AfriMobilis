'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from '../admin.module.css';

interface NiveauSanction {
    id: string;
    niveau: string;
    libelle: string;
    description: string;
    gravite: number;
}

interface MotifSanction {
    id: string;
    motif: string;
    categorie: string;
    niveau_par_defaut: string;
    description: string;
}

export default function ParametrageSanctionsPage() {
    const [niveaux, setNiveaux] = useState<NiveauSanction[]>([]);
    const [motifs, setMotifs] = useState<MotifSanction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'niveaux' | 'motifs'>('niveaux');

    const fetchData = async () => {
        setLoading(true);
        const [{ data: nivData }, { data: motData }] = await Promise.all([
            supabase.from('niveaux_sanctions').select('*').order('gravite'),
            supabase.from('motifs_sanctions').select('*').order('categorie')
        ]);
        setNiveaux(nivData || []);
        setMotifs(motData || []);
        setLoading(false);
    };

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            fetchData();
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    const niveauxParDefaut: NiveauSanction[] = [
        { id: '1', niveau: 'avertissement', libelle: 'Avertissement', description: 'Premier niveau - mise en garde écrite', gravite: 1 },
        { id: '2', niveau: 'legere', libelle: 'Sanction Légère', description: 'Retard de versement, petit manquement', gravite: 2 },
        { id: '3', niveau: 'lourde', libelle: 'Sanction Lourde', description: 'Infraction grave, récidive', gravite: 3 },
        { id: '4', niveau: 'suspension', libelle: 'Suspension', description: 'Suspension temporaire d\'activité', gravite: 4 },
    ];

    const motifsParDefaut: MotifSanction[] = [
        { id: '1', motif: 'Retard de versement', categorie: 'financier', niveau_par_defaut: 'avertissement', description: 'Non respect des délais de paiement' },
        { id: '2', motif: 'Absence non justifiée', categorie: 'discipline', niveau_par_defaut: 'legere', description: 'Absence aux réunions ou convocations' },
        { id: '3', motif: 'Refus de contrôle', categorie: 'conformite', niveau_par_defaut: 'lourde', description: 'Refus de se soumettre au contrôle' },
        { id: '4', motif: 'Documents non conformes', categorie: 'conformite', niveau_par_defaut: 'legere', description: 'Papiers expirés ou invalides' },
        { id: '5', motif: 'Comportement inapproprié', categorie: 'ethique', niveau_par_defaut: 'legere', description: 'Incivilités envers passagers ou agents' },
    ];

    const displayNiveaux = niveaux.length > 0 ? niveaux : niveauxParDefaut;
    const displayMotifs = motifs.length > 0 ? motifs : motifsParDefaut;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>⚖️ Paramétrage Sanctions</h1>
                <p className={styles.subtitle}>
                    Configuration des niveaux de sanctions et des motifs
                </p>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'niveaux' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('niveaux')}
                >
                    Niveaux de Sanctions
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'motifs' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('motifs')}
                >
                    Motifs de Sanctions
                </button>
            </div>

            {activeTab === 'niveaux' ? (
                <div className={styles.section}>
                    <h2>Niveaux hiérarchiques (du plus léger au plus grave)</h2>
                    <div className={styles.niveauxList}>
                        {displayNiveaux.map((niveau, index) => (
                            <div key={niveau.id} className={styles.niveauCard}>
                                <div className={styles.niveauHeader}>
                                    <span className={styles.niveauNumber}>{index + 1}</span>
                                    <span className={`${styles.graviteBadge} ${styles[niveau.niveau]}`}>
                                        {niveau.niveau}
                                    </span>
                                </div>
                                <h3>{niveau.libelle}</h3>
                                <p>{niveau.description}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className={styles.workflowSection}>
                        <h3>🔄 Workflow de validation</h3>
                        <ul>
                            <li>Avertissement → Validation automatique par le système</li>
                            <li>Sanction légère → Validation par le Chef de Ligne</li>
                            <li>Sanction lourde → Validation par le Chef de Ligne + notification Super Admin</li>
                            <li>Suspension → Validation Super Admin obligatoire</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className={styles.section}>
                    <h2>Motifs de sanctions par catégorie</h2>
                    <div className={styles.motifsTable}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Catégorie</th>
                                    <th>Motif</th>
                                    <th>Niveau par défaut</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayMotifs.map((motif) => (
                                    <tr key={motif.id}>
                                        <td>
                                            <span className={styles.categorieBadge}>
                                                {motif.categorie}
                                            </span>
                                        </td>
                                        <td><strong>{motif.motif}</strong></td>
                                        <td>
                                            <span className={`${styles.niveauBadge} ${styles[motif.niveau_par_defaut]}`}>
                                                {motif.niveau_par_defaut}
                                            </span>
                                        </td>
                                        <td>{motif.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
