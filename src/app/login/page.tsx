'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [loginInput, setLoginInput] = useState(''); // Peut être téléphone OU email
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Vérifier si c'est le Super Admin avec son email direct
            const SUPER_ADMIN_EMAIL = 'franckdanielcape@gmail.com';
            
            let emailToUse = '';
            
            if (loginInput.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
                // Super Admin avec email direct
                emailToUse = SUPER_ADMIN_EMAIL;
            } else {
                // Vérifier si c'est le Super Admin avec son numéro
                let cleanPhone = loginInput.replace(/[^0-9]/g, '');
                if (!cleanPhone.startsWith('225')) {
                    cleanPhone = '225' + cleanPhone;
                }
                
                const SUPER_ADMIN_PHONE = '2250708124233';
                
                if (cleanPhone === SUPER_ADMIN_PHONE) {
                    // Super Admin avec téléphone - utiliser son email pour la connexion
                    emailToUse = SUPER_ADMIN_EMAIL;
                } else {
                    // Autre utilisateur - connexion par téléphone
                    emailToUse = `${cleanPhone}@afrimobilis.local`;
                }
            }
            
            // Connexion Supabase pour TOUS les utilisateurs (y compris Super Admin)
            const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password: password,
            });

            if (signInError) {
                setError('Identifiant ou mot de passe incorrect');
                setLoading(false);
                return;
            }

            if (session) {
                // Récupérer le profil pour connaître le rôle
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                
                // Rediriger selon le rôle
                if (profile?.role === 'super_chef_de_ligne') {
                    router.push('/dashboard/super-chef');
                } else if (profile?.role === 'chef_ligne' || profile?.role === 'admin_syndicat') {
                    router.push('/dashboard/chef-ligne');
                } else if (profile?.role === 'super_admin') {
                    router.push('/dashboard/admin');
                } else {
                    // Passager ou autre rôle
                    router.push('/dashboard');
                }
            }
        } catch {
            setError('Erreur de connexion');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bgCircle1}></div>
            <div className={styles.bgCircle2}></div>

            <div className={`${styles.loginCard} glass-panel fade-in`}>
                <div className={styles.header}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoHighlight}>Afri</span>Mobilis
                    </Link>
                    <h1 className={styles.title}>Connexion</h1>
                    <p className={styles.subtitle}>
                        Entrez votre numéro de téléphone ou email et mot de passe
                    </p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <Input
                        label="Numéro de téléphone ou Email"
                        type="text"
                        placeholder="Ex: 07 XX XX XX XX"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        fullWidth
                    />

                    <div className={styles.passwordWrapper}>
                        <Input
                            label="Mot de passe"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            fullWidth
                        />
                        <button
                            type="button"
                            className={styles.eyeButton}
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <div className={styles.forgotPassword}>
                        <Link href="/reset-password">Mot de passe oublié ?</Link>
                    </div>

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>Vous n&apos;avez pas de compte ?</p>
                    <div className={styles.registerOptions}>
                        <Link href="/register" className={styles.registerLink}>👤 Passager</Link>
                        <span className={styles.divider}>|</span>
                        <Link href="/register/chauffeur" className={styles.registerLink}>🚕 Chauffeur</Link>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        🏢 Les syndicats sont créés par le Super Admin uniquement
                    </p>
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <Link href="/" className={styles.backLink}>← Retour à l&apos;accueil</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
