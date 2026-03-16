'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import styles from './equipeModals.module.css';
import { supabase } from '@/utils/supabase/client';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    syndicatId: string | null;
    roles: Array<{ id: string; nom: string; niveau: number }>;
    niveau: 3 | 4;
}

export function AddMemberModal({ isOpen, onClose, onSuccess, syndicatId, roles, niveau }: AddMemberModalProps) {
    const [formData, setFormData] = useState({ nom: '', prenom: '', email: '', phone: '', customRoleId: '' });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Note: In a real MVP with complete auth, we should call a backend endpoint
            // to create the Auth user and assign the profile. Here we simulate it.
            const response = await fetch('http://localhost:4000/api/equipe/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    syndicat_id: syndicatId,
                    role: niveau === 3 ? 'sous_admin' : 'agent_terrain',
                    custom_role_id: formData.customRoleId || null,
                    // auth user id who is creating this user:
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                alert("Erreur: " + errorData.error);
            }
        } catch (error: unknown) {
            alert("Erreur lors de la création: " + (error instanceof Error ? error.message : 'Erreur inconnue'));
        } finally {
            setSubmitting(false);
        }
    };

    const typeLabel = niveau === 3 ? "Membre du Bureau (Niv 3)" : "Agent de Terrain (Niv 4)";
    const availableRoles = roles.filter(r => r.niveau === niveau);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Ajouter {typeLabel}</h2>
                    <p className={styles.modalDescription}>Remplissez les informations pour créer un nouvel accès.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nom <span className={styles.required}>*</span></label>
                            <input required type="text" className={styles.input} value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Prénom <span className={styles.required}>*</span></label>
                            <input required type="text" className={styles.input} value={formData.prenom} onChange={e => setFormData({ ...formData, prenom: e.target.value })} />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                            <input required type="email" className={styles.input} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Téléphone <span className={styles.required}>*</span></label>
                            <input required type="text" className={styles.input} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Rôle Personnalisé (Optionnel)</label>
                        <select className={styles.input} value={formData.customRoleId} onChange={e => setFormData({ ...formData, customRoleId: e.target.value })}>
                            <option value="">-- Aucun (rôle standard) --</option>
                            {availableRoles.map(r => (
                                <option key={r.id} value={r.id}>{r.nom}</option>
                            ))}
                        </select>
                        <p className={styles.hint}>Si vous n&apos;avez pas de rôles personnalisés, vous pouvez en créer un dans la section correspondante.</p>
                    </div>

                    <div className={styles.formActions}>
                        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Création...' : 'Ajouter le membre'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// AddRoleModal.tsx - can be split into a separate file if needed

interface AddRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    syndicatId: string | null;
}

export function AddRoleModal({ isOpen, onClose, onSuccess, syndicatId }: AddRoleModalProps) {
    const [nom, setNom] = useState('');
    const [niveau, setNiveau] = useState<3 | 4>(3);
    const [permissions, setPermissions] = useState({
        can_view_finance: false,
        can_create_users: false,
        can_validate_intrusions: false,
        can_manage_fleet: false
    });
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const res = await fetch('http://localhost:4000/api/equipe/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom,
                    niveau,
                    permissions_json: permissions,
                    syndicat_id: syndicatId,
                    created_by: userId
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert("Erreur: " + err.error);
            }
        } catch (error: unknown) {
            alert("Erreur: " + (error instanceof Error ? error.message : 'Erreur inconnue'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckbox = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Créer un Rôle Personnalisé</h2>
                    <p className={styles.modalDescription}>Définissez des permissions précises pour un nouveau type d&apos;accès.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nom du Rôle <span className={styles.required}>*</span></label>
                        <input required type="text" className={styles.input} placeholder="Ex: Trésorier, Contrôleur Chef" value={nom} onChange={e => setNom(e.target.value)} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Niveau Hiérarchique</label>
                        <select className={styles.input} value={niveau} onChange={e => setNiveau(Number(e.target.value) as 3 | 4)}>
                            <option value={3}>Niveau 3 - Membre du Bureau (Gestion Admin)</option>
                            <option value={4}>Niveau 4 - Agent de Terrain (Opérations)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Permissions Granulaires</label>
                        <div className={styles.permissionsGrid}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={permissions.can_view_finance} onChange={() => handleCheckbox('can_view_finance')} />
                                Voir les Finances et Versements
                            </label>

                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={permissions.can_create_users} onChange={() => handleCheckbox('can_create_users')} />
                                Gérer les utilisateurs de son niveau inférieur
                            </label>

                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={permissions.can_validate_intrusions} onChange={() => handleCheckbox('can_validate_intrusions')} />
                                Valider les paiements d&apos;intrusions (Droits)
                            </label>

                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={permissions.can_manage_fleet} onChange={() => handleCheckbox('can_manage_fleet')} />
                                Gérer la flotte de véhicules
                            </label>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Création...' : 'Créer le rôle'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
