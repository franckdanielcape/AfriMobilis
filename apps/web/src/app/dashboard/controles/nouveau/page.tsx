'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import styles from './nouveau.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
    annee: number;
}

export default function NouveauControlePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<{ id: string; role: string; ville_id: string; prenom: string; nom: string } | null>(null);
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [error, setError] = useState('');

    // Formulaire
    const [formData, setFormData] = useState({
        vehicule_id: '',
        date_controle: new Date().toISOString().slice(0, 16), // Format datetime-local
        lieu: '',
        resultat: 'conforme',
        note: '',
        conformite_documents: false,
        conformite_plaque: false,
        conformite_assurance: false,
        conformite_carte_stationnement: false,
        conformite_visite_technique: false
    });

    useEffect(() => {
        const fetchUserAndData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            // Récupérer le profil
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, ville_id, prenom, nom')
                .eq('id', session.user.id)
                .single();

            if (!profile) {
                router.push('/login');
                return;
            }

            // Vérifier les permissions
            const allowedRoles = ['chef_ligne', 'admin_syndicat', 'super_chef_de_ligne', 'agent_terrain'];
            if (!allowedRoles.includes(profile.role)) {
                router.push('/dashboard');
                return;
            }

            setUser(profile);

            // Charger les véhicules de la ville
            await fetchVehicules(profile.ville_id);
            setLoading(false);
        };

        fetchUserAndData();
    }, [router]);

    const fetchVehicules = async (villeId: string) => {
        try {
            const { data, error } = await supabase
                .from('vehicules')
                .select('id, immatriculation, marque, modele, annee')
                .eq('ville_id', villeId)
                .order('immatriculation');

            if (error) throw error;
            setVehicules(data || []);
        } catch (error) {
            console.error('Erreur fetch vehicules:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            // Validation
            if (!formData.vehicule_id) {
                setError('Veuillez sélectionner un véhicule');
                setSaving(false);
                return;
            }

            const response = await fetch('/api/controles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    agent_id: user?.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    setError('Un contrôle existe déjà pour ce véhicule aujourd\'hui');
                } else {
                    setError(data.error || 'Erreur lors de la création du contrôle');
                }
                setSaving(false);
                return;
            }

            // Redirection vers la liste
            router.push('/dashboard/controles');
        } catch (error) {
            console.error('Erreur création:', error);
            setError('Erreur lors de la création du contrôle');
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <Link href="/dashboard/controles" className={styles.backLink}>
                        ← Retour aux contrôles
                    </Link>
                    <h1 className={styles.title}>Nouveau Contrôle</h1>
                    <p className={styles.subtitle}>
                        Enregistrer un contrôle terrain
                    </p>
                </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <div className={styles.formGrid}>
                    {/* Véhicule */}
                    <div className={styles.formGroup}>
                        <label htmlFor="vehicule_id">
                            Véhicule <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="vehicule_id"
                            name="vehicule_id"
                            value={formData.vehicule_id}
                            onChange={handleChange}
                            className={styles.select}
                            required
                        >
                            <option value="">Sélectionner un véhicule</option>
                            {vehicules.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.immatriculation} - {v.marque} {v.modele} ({v.annee})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date */}
                    <div className={styles.formGroup}>
                        <label htmlFor="date_controle">
                            Date et heure <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="date_controle"
                            name="date_controle"
                            value={formData.date_controle}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>

                    {/* Lieu */}
                    <div className={styles.formGroup}>
                        <label htmlFor="lieu">Lieu du contrôle</label>
                        <input
                            type="text"
                            id="lieu"
                            name="lieu"
                            value={formData.lieu}
                            onChange={handleChange}
                            placeholder="Ex: Centre-ville Grand-Bassam"
                            className={styles.input}
                        />
                    </div>

                    {/* Résultat */}
                    <div className={styles.formGroup}>
                        <label htmlFor="resultat">
                            Résultat <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="resultat"
                            name="resultat"
                            value={formData.resultat}
                            onChange={handleChange}
                            className={styles.select}
                            required
                        >
                            <option value="conforme">✓ Conforme</option>
                            <option value="non_conforme">✗ Non conforme</option>
                            <option value="avertissement">⚠ Avertissement</option>
                        </select>
                    </div>
                </div>

                {/* Vérifications */}
                <div className={styles.verifications}>
                    <h3>✓ Points de vérification</h3>
                    <div className={styles.checkboxGrid}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="conformite_documents"
                                checked={formData.conformite_documents}
                                onChange={handleChange}
                            />
                            Documents en règle
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="conformite_plaque"
                                checked={formData.conformite_plaque}
                                onChange={handleChange}
                            />
                            Plaque d'immatriculation conforme
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="conformite_assurance"
                                checked={formData.conformite_assurance}
                                onChange={handleChange}
                            />
                            Assurance valide
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="conformite_carte_stationnement"
                                checked={formData.conformite_carte_stationnement}
                                onChange={handleChange}
                            />
                            Carte de stationnement valide
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="conformite_visite_technique"
                                checked={formData.conformite_visite_technique}
                                onChange={handleChange}
                            />
                            Visite technique valide
                        </label>
                    </div>
                </div>

                {/* Notes */}
                <div className={styles.formGroup}>
                    <label htmlFor="note">Notes / Observations</label>
                    <textarea
                        id="note"
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Détails sur le contrôle, infractions constatées, etc."
                        className={styles.textarea}
                    />
                </div>

                {/* Agent */}
                <div className={styles.agentInfo}>
                    <strong>Contrôle effectué par:</strong> {user?.prenom} {user?.nom}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/dashboard/controles" className={styles.btnSecondary}>
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={saving}
                    >
                        {saving ? 'Enregistrement...' : 'Enregistrer le contrôle'}
                    </button>
                </div>
            </form>
        </div>
    );
}
