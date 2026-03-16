import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API de test pour vérifier la connexion et les fonctionnalités
// NOTE: Cette route est désactivée en production pour des raisons de sécurité

export async function GET() {
    // Vérifier si nous sommes en production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Route de test désactivée en production' },
            { status: 403 }
        );
    }

    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({
            timestamp: new Date().toISOString(),
            status: 'configuration_incomplete',
            environment: {
                supabase_url: supabaseUrl ? '✓ Configuré' : '✗ Manquant',
                service_key: serviceKey ? '✓ Configuré' : '✗ Manquant',
            },
            message: 'Variables d\'environnement manquantes. La route de test nécessite SUPABASE_SERVICE_KEY.',
        }, { status: 503 });
    }

    // Client admin pour les tests (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const results = {
        timestamp: new Date().toISOString(),
        environment: {
            supabase_url: '✓ Configuré',
            service_key: '✓ Configuré',
        },
        tests: [] as { name: string; status: 'ok' | 'error' | 'warning'; message?: string }[],
    };

    try {
        // Test 1: Connexion Supabase
        const { data: healthData, error: healthError } = await supabaseAdmin
            .from('profiles')
            .select('count')
            .limit(1)
            .single();

        if (healthError) {
            results.tests.push({
                name: 'Connexion Supabase',
                status: 'error',
                message: healthError.message,
            });
        } else {
            results.tests.push({
                name: 'Connexion Supabase',
                status: 'ok',
                message: 'Connexion établie avec succès',
            });
        }

        // Test 2: Vérifier les tables principales
        const tables = ['profiles', 'vehicules', 'syndicats', 'versements', 'pannes'];
        for (const table of tables) {
            const { error } = await supabaseAdmin
                .from(table)
                .select('count', { count: 'exact', head: true });

            if (error) {
                results.tests.push({
                    name: `Table: ${table}`,
                    status: 'error',
                    message: error.message,
                });
            } else {
                results.tests.push({
                    name: `Table: ${table}`,
                    status: 'ok',
                });
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        return NextResponse.json({
            ...results,
            tests: [
                ...results.tests,
                {
                    name: 'Erreur système',
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Erreur inconnue',
                },
            ],
        }, { status: 500 });
    }
}
