'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import styles from './test.module.css';

interface TestResult {
    name: string;
    status: 'ok' | 'error' | 'warning';
    message?: string;
}

interface TestResponse {
    timestamp: string;
    environment: Record<string, string>;
    tests: TestResult[];
    summary: {
        total: number;
        ok: number;
        warnings: number;
        errors: number;
        status: string;
    };
}

export default function TestPage() {
    const [results, setResults] = useState<TestResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runTests = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de test');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runTests();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '❓';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'ok': return styles.ok;
            case 'warning': return styles.warning;
            case 'error': return styles.error;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🧪 Page de Test</h1>
                <p>Vérification de la configuration et de la connexion aux services</p>
                <Button onClick={runTests} disabled={loading}>
                    {loading ? 'Test en cours...' : '🔄 Relancer les tests'}
                </Button>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <strong>Erreur:</strong> {error}
                </div>
            )}

            {results?.summary && (
                <div className={`${styles.summary} ${getStatusClass(results.summary.status.toLowerCase())}`}>
                    <h2>Résumé</h2>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryNumber}>{results.summary.ok}</span>
                            <span className={styles.summaryLabel}>OK</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryNumber}>{results.summary.warnings}</span>
                            <span className={styles.summaryLabel}>Avertissements</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryNumber}>{results.summary.errors}</span>
                            <span className={styles.summaryLabel}>Erreurs</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryNumber}>{results.summary.total}</span>
                            <span className={styles.summaryLabel}>Total</span>
                        </div>
                    </div>
                    <div className={styles.statusBadge}>
                        Statut: <strong>{results.summary.status}</strong>
                    </div>
                </div>
            )}

            {results?.environment && (
                <div className={styles.section}>
                    <h2>🔧 Configuration</h2>
                    <div className={styles.configGrid}>
                        {Object.entries(results.environment).map(([key, value]) => (
                            <div key={key} className={styles.configItem}>
                                <span className={styles.configKey}>{key}:</span>
                                <span className={styles.configValue}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results?.tests && (
                <div className={styles.section}>
                    <h2>📋 Tests détaillés</h2>
                    <div className={styles.testsList}>
                        {results.tests.map((test, index) => (
                            <div key={index} className={`${styles.testItem} ${getStatusClass(test.status)}`}>
                                <span className={styles.testIcon}>{getStatusIcon(test.status)}</span>
                                <div className={styles.testContent}>
                                    <span className={styles.testName}>{test.name}</span>
                                    {test.message && (
                                        <span className={styles.testMessage}>{test.message}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results?.timestamp && (
                <div className={styles.footer}>
                    Dernier test: {new Date(results.timestamp).toLocaleString('fr-FR')}
                </div>
            )}
        </div>
    );
}
