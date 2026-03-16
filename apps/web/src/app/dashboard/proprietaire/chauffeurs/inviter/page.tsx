'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button, Input } from '@/components/ui';
import styles from './inviter.module.css';

interface Vehicule {
    id: string;
    immatriculation: string;
    marque: string;
    modele: string;
}

interface FormData {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    vehicule_id: string;
}

export default function InviterChauffeur() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vehiculePreselectionne = searchParams.get('vehicule');
    
    const { isLoading: authLoading, profile } = useAuthGuard({ requiredRole: 'proprietaire' });
    
    const [formData, setFormData] = useState<FormData>({
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        vehicule_id: vehiculePreselectionne || '',
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);

    // Charger les véhicules du propriétaire
    useEffect(() => {
        if (!profile?.id) return;
        
        supabase
            .from('vehicules')
            .select('id, immatriculation, marque, modele')
            .eq('proprietaire_id', profile.id)
            .eq('statut', 'actif')
            .then(({ data }) => {
                if (data) setVehicules(data as Vehicule[]);
            });
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Vérifier si un utilisateur avec cet email existe déjà
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('email', formData.email)
                .maybeSingle();

            let chauffeurId: string;

            if (existingUser) {
                if (existingUser.role !== 'chauffeur') {
                    setError('Cet email est déjà utilisé par un compte non-chauffeur.');
                    setLoading(false);
                    return;
                }
                chauffeurId = existingUser.id;
            } else {
                // 2. Créer le compte chauffeur
                const password = Math.random().toString(36).slice(-8); // Mot de passe temporaire
                
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: password,
                    options: {
                        data: {
                            nom: formData.nom,
                            prenom: formData.prenom,
                            telephone: formData.telephone,
                            role: 'chauffeur',
                        }
                    }
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error('Erreur création utilisateur');
                
                chauffeurId = authData.user.id;
            }

            // 3. Si un véhicule est sélectionné, créer l'affectation
            if (formData.vehicule_id) {
                const { error: affError } = await supabase
                    .from('affectations')
                    .insert({
                        chauffeur_id: chauffeurId,
                        vehicule_id: formData.vehicule_id,
                        date_debut: new Date().toISOString(),
                    });

                if (affError) throw affError;
            }

            // 4. Créer une notification pour le chauffeur
            await supabase
                .from('notifications')
                .insert({
                    user_id: chauffeurId,
                    type: 'invitation',
                    titre: 'Vous avez été invité comme chauffeur',
                    message: `${profile?.prenom} ${profile?.nom} vous a ajouté comme chauffeur. Connectez-vous pour voir vos missions.`,
                });

            setSuccess(true);
            
            // Redirection après 2 secondes
            setTimeout(() => {
                router.push('/dashboard/proprietaire/chauffeurs');
            }, 2000);

        } catch (err: unknown) {
            console.error('Erreur invitation:', err);
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className={styles.loading}>Chargement...</div>;
    }

    if (success) {
        return (
            <div className={styles.successContainer}>
                <div className={styles.successIcon}>✅</div>
                <h2>Invitation envoyée !</h2>
                <p>Le chauffeur a été invité avec succès.</p>
                <p className={styles.redirectText}>Redirection en cours...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button 
                    className={styles.backBtn}
                    onClick={() => router.back()}
                >
                    ← Retour
                </button>
                <h1>👨‍✈️ Inviter un chauffeur</h1>
                <p>Ajoutez un chauffeur à votre flotte</p>
            </div>

            {error && (
                <div className={styles.errorAlert}>
                    <span>❌</span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                    <h3>Informations du chauffeur</h3>
                    
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Prénom *</label>
                            <Input
                                type="text"
                                value={formData.prenom}
                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                required
                                placeholder="Ex: Kouassi"
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>Nom *</label>
                            <Input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                required
                                placeholder="Ex: Yao"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email *</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="Ex: kouassi.yao@email.com"
                        />
                        <span className={styles.hint}>
                            Le chauffeur recevra un email d&apos;invitation
                        </span>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Téléphone *</label>
                        <Input
                            type="tel"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            required
                            placeholder="Ex: +225 07 12 34 56 78"
                        />
                    </div>
                </div>

                <div className={styles.formSection}>
                    <h3>Affectation (optionnel)</h3>
                    
                    <div className={styles.formGroup}>
                        <label>Véhicule assigné</label>
                        <select
                            value={formData.vehicule_id}
                            onChange={(e) => setFormData({ ...formData, vehicule_id: e.target.value })}
                            className={styles.select}
                        >
                            <option value="">-- Sélectionner un véhicule --</option>
                            {vehicules.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.immatriculation} - {v.marque} {v.modele}
                                </option>
                            ))}
                        </select>
                        <span className={styles.hint}>
                            Vous pouvez assigner un véhicule plus tard
                        </span>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button 
                        type="submit" 
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? 'Envoi en cours...' : '📧 Envoyer l\'invitation'}
                    </Button>
                </div>
            </form>

            <div className={styles.infoBox}>
                <h4>ℹ️ Comment ça marche ?</h4>
                <ul>
                    <li>Le chauffeur recevra un email avec un lien pour créer son mot de passe</li>
                    <li>Une fois connecté, il pourra voir ses missions et enregistrer ses versements</li>
                    <li>Vous pouvez suivre son activité depuis votre tableau de bord</li>
                </ul>
            </div>
        </div>
    );
}
