'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import styles from './error.module.css';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Error logged in development only
    }, [error]);

    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorCard}>
                <div className={styles.errorIcon}>⚠️</div>
                <h2 className={styles.errorTitle}>Une erreur est survenue</h2>
                <p className={styles.errorMessage}>
                    {error.message || 'Une erreur inattendue s&apos;est produite dans le tableau de bord.'}
                </p>
                
                <div className={styles.errorActions}>
                    <Button onClick={() => reset()} variant="primary">
                        🔄 Réessayer
                    </Button>
                    <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                        🏠 Retour à l&apos;accueil
                    </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <details className={styles.errorDetails}>
                        <summary>Détails techniques</summary>
                        <pre className={styles.errorStack}>{error.stack}</pre>
                        {error.digest && <p>Digest: {error.digest}</p>}
                    </details>
                )}
            </div>
        </div>
    );
}
