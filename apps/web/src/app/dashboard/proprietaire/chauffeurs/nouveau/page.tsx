'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import styles from './nouveau.module.css';

export default function NouveauChauffeurPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        password: '',
        permis_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{phone: string, password: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simuler la création (en mode démo)
        setTimeout(() => {
            setCreatedCredentials({
                phone: formData.telephone,
                password: formData.password
            });
            setSuccess(true);
            setLoading(false);
        }, 1000);
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password });
    };

    if (success && createdCredentials) {
        return (
            <div className={styles.container}>
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✅</div>
                    <h2>Chauffeur créé avec succès !</h2>
                    <p>Transmettez ces identifiants au chauffeur :</p>
                    
                    <div className={styles.credentialsBox}>
                        <div className={styles.credentialItem}>
                            <span>📱 Numéro de téléphone :</span>
                            <strong>{createdCredentials.phone}</strong>
                        </div>
                        <div className={styles.credentialItem}>
                            <span>🔑 Mot de passe :</span>
                            <strong>{createdCredentials.password}</strong>
                        </div>
                    </div>

                    <div className={styles.shareOptions}>
                        <p>Partager via :</p>
                        <div className={styles.shareButtons}>
                            <a 
                                href={`https://wa.me/?text=Voici%20vos%20identifiants%20AfriMobilis:%0A📱%20Téléphone:%20${createdCredentials.phone}%0A🔑%20Mot%20de%20passe:%20${createdCredentials.password}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.whatsappBtn}
                            >
                                💬 WhatsApp
                            </a>
                            <button 
                                className={styles.copyBtn}
                                onClick={() => {
                                    navigator.clipboard.writeText(`Téléphone: ${createdCredentials.phone}\nMot de passe: ${createdCredentials.password}`);
                                    alert('Copié dans le presse-papier !');
                                }}
                            >
                                📋 Copier
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/dashboard/proprietaire/chauffeurs">
                            <Button variant="secondary">← Retour à la liste</Button>
                        </Link>
                        <Button onClick={() => {
                            setSuccess(false);
                            setFormData({ nom: '', prenom: '', telephone: '', password: '', permis_number: '' });
                        }}>
                            + Créer un autre
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/dashboard/proprietaire/chauffeurs" className={styles.backLink}>
                    ← Retour
                </Link>
                <h1>👨‍✈️ Nouveau Chauffeur</h1>
                <p>Créez un compte chauffeur pour votre véhicule</p>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <Input
                            label="Nom *"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            required
                        />
                        <Input
                            label="Prénom *"
                            value={formData.prenom}
                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Numéro de téléphone *"
                        type="tel"
                        placeholder="07 XX XX XX XX"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        required
                    />

                    <Input
                        label="Numéro de permis"
                        value={formData.permis_number}
                        onChange={(e) => setFormData({ ...formData, permis_number: e.target.value })}
                    />

                    <div className={styles.passwordSection}>
                        <Input
                            label="Mot de passe temporaire *"
                            type="text"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <Button 
                            type="button" 
                            variant="secondary"
                            onClick={generatePassword}
                            className={styles.generateBtn}
                        >
                            🎲 Générer
                        </Button>
                    </div>

                    <div className={styles.infoBox}>
                        <p>💡 <strong>Important :</strong></p>
                        <ul>
                            <li>Le chauffeur recevra ces identifiants pour se connecter</li>
                            <li>Vous pouvez partager via WhatsApp ou copier/coller</li>
                            <li>Le chauffeur pourra changer son mot de passe après connexion</li>
                        </ul>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/dashboard/proprietaire/chauffeurs">
                            <Button type="button" variant="secondary">Annuler</Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Création...' : '✓ Créer le chauffeur'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
