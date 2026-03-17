'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import styles from './syndicat.module.css';

export default function RegisterSyndicat() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Admin
    prenom: '',
    nom: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    // Syndicat
    nomSyndicat: '',
    ville: 'Grand-Bassam',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
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
      const response = await fetch('/api/auth/register-syndicat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: formData.telephone,
          password: formData.password,
          nom: formData.nom,
          prenom: formData.prenom,
          nomSyndicat: formData.nomSyndicat,
          ville: formData.ville,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erreur lors de l\'inscription');
      }

      setSuccess(true);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);

    } catch (err: unknown) {
      console.error('Erreur inscription:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
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
          <p>Votre syndicat et votre compte admin ont été créés avec succès.</p>
          <p>Vous allez être redirigé vers la page de connexion...</p>
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
          <h1>🏢 Inscription Syndicat</h1>
          <p>Créez votre syndicat et votre compte administrateur</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Section Syndicat */}
          <div className={styles.section}>
            <h3>🏢 Informations du Syndicat</h3>
            
            <div className={styles.formGroup}>
              <label>Nom du syndicat *</label>
              <Input
                type="text"
                value={formData.nomSyndicat}
                onChange={(e) => setFormData({ ...formData, nomSyndicat: e.target.value })}
                required
                placeholder="Ex: Syndicat des Taxis de Grand-Bassam"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ville</label>
              <select
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                className={styles.select}
              >
                <option value="Grand-Bassam">Grand-Bassam</option>
                <option value="Abidjan">Abidjan</option>
                <option value="Bouaké">Bouaké</option>
                <option value="Yamoussoukro">Yamoussoukro</option>
                <option value="San-Pédro">San-Pédro</option>
              </select>
            </div>
          </div>

          {/* Section Administrateur */}
          <div className={styles.section}>
            <h3>👤 Informations de l&apos;Administrateur</h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Prénom *</label>
                <Input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  placeholder="Ex: Amadou"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Nom *</label>
                <Input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  placeholder="Ex: Koné"
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
              <span className={styles.fieldHint}>Ce numéro servira d&apos;identifiant de connexion</span>
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
          </div>

          <Button 
            type="submit" 
            variant="primary"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Création en cours...' : '🏢 Créer mon syndicat'}
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
