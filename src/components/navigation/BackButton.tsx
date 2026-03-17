'use client';

import { useRouter } from 'next/navigation';
import styles from './BackButton.module.css';

interface BackButtonProps {
    label?: string;
    fallbackUrl?: string;
    className?: string;
}

export default function BackButton({ 
    label = '← Retour', 
    fallbackUrl = '/dashboard',
    className = '' 
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // Essayer de revenir en arrière dans l'historique
        if (window.history.length > 2) {
            router.back();
        } else {
            // Sinon aller à l'URL de fallback
            router.push(fallbackUrl);
        }
    };

    return (
        <button 
            onClick={handleBack}
            className={`${styles.backButton} ${className}`}
        >
            {label}
        </button>
    );
}
