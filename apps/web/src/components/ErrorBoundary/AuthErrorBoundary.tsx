'use client';

import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary pour capturer les erreurs d'authentification
 * et rediriger vers la page de login si nécessaire
 */
class AuthErrorBoundaryClass extends Component<Props & { router: ReturnType<typeof useRouter> }, State> {
    constructor(props: Props & { router: ReturnType<typeof useRouter> }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        // Error capturée - rediriger si erreur d'auth

        // Si c'est une erreur d'auth, rediriger vers login
        interface ApiError extends Error {
            statusCode?: number;
        }
        if (error.name === 'ApiError' && (error as ApiError).statusCode === 401) {
            // Attendre un peu pour que l'utilisateur voie le message
            setTimeout(() => {
                this.props.router.push('/login?redirect=unauthorized');
            }, 2000);
        }
    }

    render() {
        if (this.state.hasError) {
            interface ApiError extends Error {
                statusCode?: number;
            }
            const isAuthError = this.state.error?.name === 'ApiError' && 
                               (this.state.error as ApiError).statusCode === 401;

            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                        {isAuthError ? '🔒' : '⚠️'}
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        {isAuthError ? 'Session expirée' : 'Une erreur est survenue'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        {isAuthError 
                            ? 'Vous allez être redirigé vers la page de connexion...'
                            : this.state.error?.message || 'Veuillez réessayer'
                        }
                    </p>
                    {isAuthError && (
                        <button
                            onClick={() => this.props.router.push('/login')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Se reconnecter
                        </button>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper pour pouvoir utiliser useRouter dans un class component
export function AuthErrorBoundary({ children }: Props) {
    const router = useRouter();
    return <AuthErrorBoundaryClass router={router}>{children}</AuthErrorBoundaryClass>;
}
