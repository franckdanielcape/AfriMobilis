'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui';
import styles from './ErrorBoundary.module.css';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Error capturée - enregistrer via service de monitoring si disponible
        this.setState({ error, errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorCard}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <h1 className={styles.errorTitle}>Oups ! Une erreur est survenue</h1>
                        <p className={styles.errorMessage}>
                            {this.state.error?.message || 'Une erreur inattendue s\'est produite.'}
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className={styles.errorDetails}>
                                <summary>Détails techniques (développement)</summary>
                                <pre className={styles.errorStack}>
                                    {this.state.error?.stack}
                                    {'\n\nComponent Stack:\n'}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className={styles.errorActions}>
                            <Button onClick={this.handleReset} variant="primary">
                                🔄 Rafraîchir la page
                            </Button>
                            <Button onClick={this.handleGoHome} variant="secondary">
                                🏠 Retour à l&apos;accueil
                            </Button>
                        </div>

                        <p className={styles.errorHelp}>
                            Si le problème persiste, veuillez contacter le support technique.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
