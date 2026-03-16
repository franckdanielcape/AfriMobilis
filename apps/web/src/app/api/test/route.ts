import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Client admin pour les tests (bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// API de test pour vérifier la connexion et les fonctionnalités
export async function GET() {
    const results = {
        timestamp: new Date().toISOString(),
        environment: {
            supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configuré' : '✗ Manquant',
            service_key: process.env.SUPABASE_SERVICE_KEY ? '✓ Configuré' : '✗ Manquant',
        },
        tests: [] as { name: string; status: 'ok' | 'error' | 'warning'; message?: string }[],
    };

    // Test 1: Variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        results.tests.push({ 
            name: 'Configuration', 
            status: 'error', 
            message: 'NEXT_PUBLIC_SUPABASE_URL manquant' 
        });
        return NextResponse.json(results, { status: 500 });
    }

    // Test 2: Connexion Supabase
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        results.tests.push({ 
            name: 'Connexion Supabase', 
            status: 'ok', 
            message: 'Connecté avec succès' 
        });
    } catch (err) {
        results.tests.push({ 
            name: 'Connexion Supabase', 
            status: 'error', 
            message: err instanceof Error ? err.message : 'Erreur de connexion' 
        });
        return NextResponse.json(results, { status: 500 });
    }

    // Test 3: Tables principales
    const tables = [
        { name: 'profiles', required: true },
        { name: 'vehicules', required: true },
        { name: 'affectations', required: false },
        { name: 'versements', required: false },
        { name: 'documents_conformite', required: false },
        { name: 'paiements_visites', required: false },
    ];

    for (const table of tables) {
        try {
            const { count, error } = await supabaseAdmin
                .from(table.name)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (table.required) {
                    results.tests.push({ 
                        name: `Table ${table.name}`, 
                        status: 'error', 
                        message: error.message 
                    });
                } else {
                    results.tests.push({ 
                        name: `Table ${table.name}`, 
                        status: 'warning', 
                        message: 'Table optionnelle non disponible' 
                    });
                }
            } else {
                results.tests.push({ 
                    name: `Table ${table.name}`, 
                    status: 'ok', 
                    message: `${count || 0} enregistrements` 
                });
            }
        } catch (err) {
            results.tests.push({ 
                name: `Table ${table.name}`, 
                status: table.required ? 'error' : 'warning', 
                message: 'Erreur d\'accès' 
            });
        }
    }

    // Test 4: Fonctions et triggers
    try {
        const { data, error } = await supabaseAdmin.rpc('version');
        results.tests.push({ 
            name: 'Fonctions PostgreSQL', 
            status: error ? 'warning' : 'ok', 
            message: error ? 'Certaines fonctions peuvent manquer' : 'Fonctions disponibles' 
        });
    } catch {
        results.tests.push({ 
            name: 'Fonctions PostgreSQL', 
            status: 'warning', 
            message: 'Vérification impossible' 
        });
    }

    // Résumé
    const errors = results.tests.filter(t => t.status === 'error').length;
    const warnings = results.tests.filter(t => t.status === 'warning').length;
    
    const status = errors > 0 ? 500 : warnings > 0 ? 207 : 200;
    
    return NextResponse.json({
        ...results,
        summary: {
            total: results.tests.length,
            ok: results.tests.filter(t => t.status === 'ok').length,
            warnings,
            errors,
            status: errors > 0 ? 'ERROR' : warnings > 0 ? 'WARNING' : 'OK'
        }
    }, { status });
}
