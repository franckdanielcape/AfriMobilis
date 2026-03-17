'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './UnauthorizedModal.module.css';

/**
 * Modal affiché quand l&apos;utilisateur tente d&apos;accéder à une ressource non autorisée
 */
export function UnauthorizedModal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isVisible, setIsVisible] = useState(false);

    useLayoutEffect(() => {
        const error = searchParams.get('error');
        if (error === 'unauthorized') {
            const frameId = requestAnimationFrame(() => {
                setIsVisible(true);
            });
            return () => cancelAnimationFrame(frameId);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsVisible(false);
        router.replace('/dashboard');
    };

    const handleGoBack = () => {
        setIsVisible(false);
        router.back();
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.icon}>🚫</div>
                <h2 className={styles.title}>Accès non autorisé</h2>
                <p className={styles.message}>
                    Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
                </p>
                <div className={styles.actions}>
                    <button onClick={handleGoBack} className={styles.secondaryButton}>
                        ← Retour
                    </button>
                    <button onClick={handleClose} className={styles.primaryButton}>
                        Aller au tableau de bord
                    </button>
                </div>
            </div>
        </div>
    );
}
