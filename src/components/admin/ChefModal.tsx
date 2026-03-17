'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui';
import styles from './ChefModal.module.css';

interface ChefModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    syndicatId: string;
    chefToEdit?: {
        id: string;
        nom?: string;
        prenom?: string;
        email?: string;
        phone?: string;
        telephone?: string;
    } | null;
}

export function ChefModal({ isOpen, onClose, onSuccess, syndicatId, chefToEdit }: ChefModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [formData, setFormData] = useState({ 
        nom: '', 
        prenom: '', 
        email: '', 
        phone: '', 
        password: '' 
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials, setCredentials] = useState({ phone: '', password: '' });

    useEffect(() => {
        if (chefToEdit) {
            setFormData({
                nom: chefToEdit.nom || '',
                prenom: chefToEdit.prenom || '',
                email: chefToEdit.email || '',
                phone: chefToEdit.phone || chefToEdit.telephone || '',
                password: '' // Don't preset password on edit
            });
        } else {
            setFormData({ nom: '', prenom: '', email: '', phone: '', password: '' });
        }
    }, [chefToEdit, isOpen]);

    // Fermer en cliquant à l'extérieur
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Fermer avec la touche Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            if (chefToEdit) {
                // Modification d'un chef existant via l'API
                const response = await fetch('/api/chefs', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: chefToEdit.id,
                        nom: formData.nom,
                        prenom: formData.prenom,
                        telephone: formData.phone
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Erreur lors de la modification');
                }
                
                alert('✅ Modifications sauvegardées dans la base de données');
                onSuccess();
                onClose();
            } else {
                // Création d'un nouveau chef via l'API
                try {
                    // Utiliser le mot de passe généré ou celui du formulaire
                    const passwordToUse = formData.password || generatedPassword;
                    
                    const response = await fetch('/api/chefs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nom: formData.nom,
                            prenom: formData.prenom,
                            email: formData.email,
                            telephone: formData.phone,
                            syndicat_id: syndicatId,
                            password: passwordToUse  // Envoi du mot de passe
                        })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.error || 'Erreur lors de la création');
                    }
                    
                    // Afficher les identifiants dans une modal personnalisée
                    showCredentialsModal(formData.phone, passwordToUse);
                    
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Erreur lors de la création';
                    alert(`❌ Erreur lors de la création: ${message}`);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue';
            alert("❌ Erreur : " + message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!chefToEdit) return;
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce chef ?")) return;

        setDeleting(true);
        try {
            const response = await fetch('/api/chefs', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: chefToEdit.id })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erreur lors de la suppression');
            }
            
            alert('✅ Chef supprimé de la base de données');
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Une erreur est survenue';
            alert("❌ Erreur : " + message);
        } finally {
            setDeleting(false);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let pwd = '';
        for (let i = 0; i < 10; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedPassword(pwd);
        setFormData({ ...formData, password: pwd });
    };

    const showCredentialsModal = (phone: string, password: string) => {
        setCredentials({ phone, password });
        setShowCredentials(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copié dans le presse-papier !');
        }).catch(() => {
            // Fallback pour anciens navigateurs
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Copié dans le presse-papier !');
        });
    };

    const closeCredentialsModal = () => {
        setShowCredentials(false);
        onSuccess();
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <h2>
                        {chefToEdit ? '✏️ Modifier le Chef' : '👨‍💼 Nommer un Chef de Ligne'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose} title="Fermer">
                        ×
                    </button>
                </div>
                
                <div className={styles.content}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Nom *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    placeholder="Ex: Koné"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Prénom *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.prenom}
                                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                    placeholder="Ex: Amadou"
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="optionnel@email.com"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Téléphone *</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="07 XX XX XX XX"
                                required
                            />
                        </div>

                        {!chefToEdit && (
                            <div className={styles.formGroup}>
                                <label>Mot de passe temporaire *</label>
                                <div className={styles.passwordGroup}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 6 caractères"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className={styles.generateBtn}
                                        onClick={generatePassword}
                                        title="Générer un mot de passe"
                                    >
                                        🎲 Générer
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={styles.infoBox}>
                            <strong>💡 Information importante</strong>
                            <p>
                                Le Chef de Ligne recevra ces identifiants pour se connecter à la plateforme 
                                et gérer son syndicat. Vous pourrez les lui transmettre par WhatsApp ou SMS.
                            </p>
                        </div>

                        <div className={styles.actions}>
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Annuler
                            </Button>
                            
                            {chefToEdit && (
                                <Button 
                                    type="button" 
                                    variant="danger" 
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? 'Suppression...' : '🗑️ Supprimer'}
                                </Button>
                            )}
                            
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Enregistrement...' : (chefToEdit ? '💾 Sauvegarder' : '✅ Créer le Chef')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal des identifiants */}
            {showCredentials && (
                <div className={styles.overlay} style={{ zIndex: 100 }}>
                    <div className={styles.modal} style={{ maxWidth: '450px' }}>
                        <div className={styles.header}>
                            <h2>✅ Chef créé avec succès !</h2>
                        </div>
                        <div className={styles.content}>
                            <div style={{ 
                                background: '#f0fdf4', 
                                border: '2px solid #22c55e', 
                                borderRadius: '12px', 
                                padding: '1.5rem',
                                marginBottom: '1.5rem'
                            }}>
                                <p style={{ marginBottom: '1rem', fontWeight: 600, color: '#166534' }}>
                                    📱 Identifiants à transmettre au chef :
                                </p>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                                        Téléphone :
                                    </label>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        background: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <code style={{ flex: 1, fontSize: '1.1rem', fontWeight: 600 }}>{credentials.phone}</code>
                                        <button 
                                            onClick={() => copyToClipboard(credentials.phone)}
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            📋 Copier
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                                        Mot de passe temporaire :
                                    </label>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        background: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <code style={{ flex: 1, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px' }}>{credentials.password}</code>
                                        <button 
                                            onClick={() => copyToClipboard(credentials.password)}
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            📋 Copier
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ 
                                background: '#fef3c7', 
                                border: '1px solid #f59e0b', 
                                borderRadius: '8px', 
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.875rem',
                                color: '#92400e'
                            }}>
                                ⚠️ <strong>Important :</strong> Le chef doit changer ce mot de passe lors de sa première connexion.
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button onClick={closeCredentialsModal} variant="primary">
                                    Fermer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
