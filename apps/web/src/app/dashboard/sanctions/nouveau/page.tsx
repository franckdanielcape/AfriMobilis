'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import styles from './nouveau.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
}

interface Chauffeur {
    id: string;
    nom: string;
    prenom: string;
}

export default function NouvelleSanctionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<{ id: string; role: string; ville_id: string } | null>(null);
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        vehicule_id: '',
        chauffeur_id: '',
        type_sanction: 'avertissement',
        motif: '',
        description: '',
        date_incident: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        const fetchUserAndData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('id, role, ville_id')
                .eq('id', session.user.id)
                .single();

            if (!profile) {
                router.push('/login');
                return;
            }

            const allowedRoles = ['agent_terrain', 'chef_ligne', 'admin_syndicat', 'super_chef_de_ligne'];
            if (!allowedRoles.includes(profile.role)) {
                router.push('/dashboard');
                return;
            }

            setUser(profile);
            await fetchVehicules(profile.ville_id);
            await fetchChauffeurs(profile.ville_id);
            setLoading(false);
        };

        fetchUserAndData();
    }, [router]);

    const fetchVehicules = async (villeId: string) => {
        try {
            const { data, error } = await supabase
                .from('vehicules')
                .select('id, immatriculation')
                .eq('ville_id', villeId)
                .order('immatriculation');

            if (error) throw error;
            setVehicules(data || []);
        } catch (error) {
            console.error('Erreur fetch vehicules:', error);
        }
    };

    const fetchChauffeurs = async (villeId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, nom, prenom')
                .eq('role', 'chauffeur')
                .eq('ville_id', villeId)
                .order('nom');

            if (error) throw error;
            setChauffeurs(data || []);
        } catch (error) {
            console.error('Erreur fetch chauffeurs:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!formData.vehicule_id) {
                setError('Veuillez sélectionner un véhicule');
                setSaving(false);
                return;
            }

            if (!formData.motif.trim()) {
                setError('Veuillez indiquer le motif');
                setSaving(false);
                return;
            }

            const response = await fetch('/api/sanctions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    cree_par: user?.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erreur lors de la création');
                setSaving(false);
                return;
            }

            router.push('/dashboard/sanctions');
        } catch (error) {
            console.error('Erreur création:', error);
            setError('Erreur lors de la création de la sanction');
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            <div className={styles.header}>
                <div>
                    <Link href="/dashboard/sanctions" className={styles.backLink}>
                        ← Retour aux sanctions
                    </Link>
                    <h1 className={styles.title}>Nouvelle Sanction</h1>
                    <p className={styles.subtitle}>
                        Créer une sanction ou un avertissement
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <div className={styles.formGrid}>
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
                                    {v.immatriculation}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="chauffeur_id">Chauffeur concerné</label>
                        <select
                            id="chauffeur_id"
                            name="chauffeur_id"
                            value={formData.chauffeur_id}
                            onChange={handleChange}
                            className={styles.select}
                        >
                            <option value="">Non spécifié</option>
                            {chauffeurs.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.prenom} {c.nom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="type">
                            Type de sanction <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="type"
                            name="type_sanction"
                            value={formData.type_sanction}
                            onChange={handleChange}
                            className={styles.select}
                            required
                        >
                            <option value="avertissement">⚠ Avertissement</option>
                            <option value="legere">📋 Sanction légère</option>
                            <option value="lourde">⚠️ Sanction lourde</option>
                            <option value="suspension">🚫 Suspension</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="date_incident">
                            Date de l&apos;incident <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="date_incident"
                            name="date_incident"
                            value={formData.date_incident}
                            onChange={handleChange}
                            className={styles.input}
                            required
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="motif">
                        Motif <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="text"
                        id="motif"
                        name="motif"
                        value={formData.motif}
                        onChange={handleChange}
                        placeholder="Ex: Non-respect du code de la route, retard..."
                        className={styles.input}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description">Description détaillée</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Détails sur l'incident, circonstances, etc."
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.infoBox}>
                    <strong>ℹ️ Information :</strong> La sanction sera créée avec le statut &quot;En attente&quot;.
                    Un Chef de Ligne devra la valider pour qu&apos;elle soit effective.
                </div>

                <div className={styles.actions}>
                    <Link href="/dashboard/sanctions" className={styles.btnSecondary}>
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={saving}
                    >
                        {saving ? 'Enregistrement...' : 'Créer la sanction'}
                    </button>
                </div>
            </form>
        </div>
    );
}
