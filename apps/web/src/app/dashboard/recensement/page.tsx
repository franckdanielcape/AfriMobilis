'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import styles from './recensement.module.css';

export default function RecensementPage() {
    const router = useRouter();
    const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'chef_ligne' });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        // Véhicule
        immatriculation: '',
        marque: '',
        modele: '',
        annee: '',
        couleur: '',
        // Propriétaire
        nomProprietaire: '',
        prenomProprietaire: '',
        telephoneProprietaire: '',
        typeProprietaire: 'proprietaire', // ou 'proprietaire_chauffeur'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Créer le véhicule
            const { data: vehicule, error: vehiculeError } = await supabase
                .from('vehicules')
                .insert({
                    immatriculation: formData.immatriculation.toUpperCase(),
                    marque: formData.marque,
                    modele: formData.modele,
                    annee: parseInt(formData.annee) || null,
                    couleur: formData.couleur,
                    statut: 'en_attente', // En attente de validation documents
                    syndicat_id: profile?.syndicat_id,
                    created_by: profile?.id,
                })
                .select()
                .single();

            if (vehiculeError) throw vehiculeError;

            // 2. Créer le compte propriétaire (auth + profile)
            const response = await fetch('/api/auth/register-proprietaire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: formData.nomProprietaire,
                    prenom: formData.prenomProprietaire,
                    telephone: formData.telephoneProprietaire,
                    role: formData.typeProprietaire,
                    vehicule_id: vehicule.id,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erreur création propriétaire');
            }

            setSuccess(true);
            
            // Reset form après 2 secondes
            setTimeout(() => {
                setFormData({
                    immatriculation: '',
                    marque: '',
                    modele: '',
                    annee: '',
                    couleur: '',
                    nomProprietaire: '',
                    prenomProprietaire: '',
                    telephoneProprietaire: '',
                    typeProprietaire: 'proprietaire',
                });
                setSuccess(false);
            }, 2000);

        } catch (error: unknown) {
            console.error('Erreur recensement:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            alert('Erreur: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className={styles.loading}>Chargement...</div>;

    if (success) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successIcon}>✅</div>
                <h2>Véhicule et propriétaire enregistrés !</h2>
                <p>Le propriétaire recevra un WhatsApp avec ses accès.</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📝 Recensement Terrain</h1>
                <p>Enregistrement d&apos;un nouveau taxi sur la ligne Grand-Bassam</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Section Véhicule */}
                <div className={styles.section}>
                    <h3>🚕 Informations du Véhicule</h3>
                    
                    <div className={styles.formGroup}>
                        <label>Numéro d&apos;immatriculation *</label>
                        <Input
                            type="text"
                            value={formData.immatriculation}
                            onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                            required
                            placeholder="Ex: AB-1234-CD"
                            style={{ textTransform: 'uppercase' }}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Marque *</label>
                            <Input
                                type="text"
                                value={formData.marque}
                                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                                required
                                placeholder="Ex: Toyota"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Modèle *</label>
                            <Input
                                type="text"
                                value={formData.modele}
                                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                                required
                                placeholder="Ex: Corolla"
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Année</label>
                            <Input
                                type="number"
                                value={formData.annee}
                                onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                                placeholder="Ex: 2022"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Couleur</label>
                            <Input
                                type="text"
                                value={formData.couleur}
                                onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                                placeholder="Ex: Blanc"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Propriétaire */}
                <div className={styles.section}>
                    <h3>👤 Informations du Propriétaire</h3>
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Prénom *</label>
                            <Input
                                type="text"
                                value={formData.prenomProprietaire}
                                onChange={(e) => setFormData({ ...formData, prenomProprietaire: e.target.value })}
                                required
                                placeholder="Ex: Kouassi"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Nom *</label>
                            <Input
                                type="text"
                                value={formData.nomProprietaire}
                                onChange={(e) => setFormData({ ...formData, nomProprietaire: e.target.value })}
                                required
                                placeholder="Ex: Jean"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Numéro de téléphone *</label>
                        <Input
                            type="tel"
                            value={formData.telephoneProprietaire}
                            onChange={(e) => setFormData({ ...formData, telephoneProprietaire: e.target.value })}
                            required
                            placeholder="Ex: +225 07 12 34 56 78"
                        />
                        <small>Ce numéro servira d&apos;identifiant de connexion</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Type de propriétaire</label>
                        <select
                            value={formData.typeProprietaire}
                            onChange={(e) => setFormData({ ...formData, typeProprietaire: e.target.value })}
                            className={styles.select}
                        >
                            <option value="proprietaire">Propriétaire uniquement</option>
                            <option value="proprietaire_chauffeur">Propriétaire-Chauffeur (conduit lui-même)</option>
                        </select>
                    </div>
                </div>

                <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loading}
                    className={styles.submitBtn}
                >
                    {loading ? 'Enregistrement...' : '✅ Enregistrer le véhicule'}
                </Button>
            </form>

            <div className={styles.infoBox}>
                <h4>ℹ️ Prochaines étapes</h4>
                <ol>
                    <li>Le propriétaire recevra un <strong>WhatsApp</strong> avec ses accès temporaires</li>
                    <li>Il devra <strong>changer son mot de passe</strong> à la première connexion</li>
                    <li>Il devra <strong>ajouter les documents</strong> (carte grise, assurance...)</li>
                    <li>Vous recevrez une notification pour <strong>valider les documents</strong></li>
                    <li>Une fois validé, le véhicule sera <strong>actif sur la ligne</strong></li>
                </ol>
            </div>
        </div>
    );
}
