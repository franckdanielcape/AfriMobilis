'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { Button, Input } from '@/components/ui';
import styles from './chauffeur.module.css';

export default function RegisterChauffeur() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      // Créer un email à partir du téléphone
      const email = `${formData.telephone.replace(/[^0-9]/g, '')}@afrimobilis.local`;

      // 1. Créer le compte dans Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            role: 'chauffeur_sans_vehicule',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Créer le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            email: email,
            role: 'chauffeur_sans_vehicule',
            statut: 'actif',
          });

        if (profileError) throw profileError;

        setSuccess(true);
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      }
    } catch (err: unknown) {
      console.error('Erreur inscription:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✅</div>
          <h2>Inscription réussie !</h2>
          <p>Votre compte a été créé avec succès.</p>
          <p>Vous pouvez maintenant vous connecter avec votre numéro de téléphone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoHighlight}>Afri</span>Mobilis
          </Link>
          <h1>🚕 Inscription Chauffeur</h1>
          <p>Créez votre compte pour trouver un véhicule</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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
                placeholder="Ex: Jean"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Numéro de téléphone *</label>
            <Input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              required
              placeholder="Ex: +225 07 12 34 56 78"
            />
            <small>Ce numéro servira d&apos;identifiant de connexion</small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Mot de passe *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Min. 6 caractères"
                minLength={6}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Confirmer le mot de passe *</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            variant="primary"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Création en cours...' : '🚕 Créer mon compte'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>Vous avez déjà un compte ? <Link href="/login">Connectez-vous</Link></p>
          <p className={styles.backLink}><Link href="/">← Retour à l&apos;accueil</Link></p>
        </div>
      </div>
    </div>
  );
}
