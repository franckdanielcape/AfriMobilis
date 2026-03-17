'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from '../login/login.module.css'; // Reusing login styles for consistency

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            setLoading(false);
            return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nom: formData.nom,
                    prenom: formData.prenom,
                    telephone: formData.telephone,
                }
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            setSuccessMessage('Inscription réussie ! Un email de confirmation vous a été envoyé.');
            // Update local profile directly just in case the trigger takes time, or redirect to login
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bgCircle1}></div>
            <div className={styles.bgCircle2}></div>

            <div className={`${styles.loginCard} glass-panel fade-in`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoHighlight}>Rejoindre Afri</span>Mobilis
                    </Link>
                    <p className={styles.subtitle}>Créez votre compte Passager (gratuit)</p>
                </div>

                <form onSubmit={handleRegister} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {successMessage && <div style={{ color: 'var(--success)', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>{successMessage}</div>}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Nom"
                            name="nom"
                            placeholder="Doe"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                        <Input
                            label="Prénom"
                            name="prenom"
                            placeholder="John"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                            fullWidth
                        />
                    </div>

                    <Input
                        label="Téléphone"
                        type="tel"
                        name="telephone"
                        placeholder="+225 0102030405"
                        value={formData.telephone}
                        onChange={handleChange}
                        fullWidth
                    />

                    <Input
                        label="Adresse Email"
                        type="email"
                        name="email"
                        placeholder="vous@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        fullWidth
                    />

                    <Input
                        label="Mot de passe"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        fullWidth
                    />

                    <Input
                        label="Confirmer le mot de passe"
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        fullWidth
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Inscription en cours...' : 'Créer mon compte'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    Vous avez déjà un compte ? <Link href="/login" className={styles.registerLink}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
