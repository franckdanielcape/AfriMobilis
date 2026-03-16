/**
 * Script de test du flux d'authentification complet
 * Test: Inscription → Login → Appel API protégé
 * 
 * Usage: npx ts-node test-auth-flow.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // Pour les tests, on utilise la clé disponible

const API_URL = 'http://localhost:4000/api';

// Utilisateur de test
const TEST_USER = {
    email: `test.user${Date.now()}@example.com`,
    password: 'Test123!@#',
    nom: 'Test',
    prenom: 'Utilisateur',
    telephone: '+22501234567'
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthFlow() {
    console.log('🧪 Test du flux d\'authentification\n');
    console.log('================================\n');

    let accessToken: string | null = null;

    // ÉTAPE 1: Inscription
    console.log('📋 Étape 1: Inscription');
    console.log(`   Email: ${TEST_USER.email}`);
    
    try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: TEST_USER.email,
            password: TEST_USER.password,
            options: {
                data: {
                    nom: TEST_USER.nom,
                    prenom: TEST_USER.prenom,
                    telephone: TEST_USER.telephone,
                }
            }
        });

        if (signUpError) {
            console.error('   ❌ Échec:', signUpError.message);
            return;
        }

        console.log('   ✅ Inscription réussie');
        console.log(`   User ID: ${signUpData.user?.id}`);
        
        // Attendre que le trigger crée le profil
        await delay(2000);
    } catch (err: any) {
        console.error('   ❌ Erreur:', err.message);
        return;
    }

    // ÉTAPE 2: Login
    console.log('\n📋 Étape 2: Login');
    
    try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });

        if (signInError) {
            console.error('   ❌ Échec:', signInError.message);
            return;
        }

        console.log('   ✅ Login réussi');
        accessToken = signInData.session?.access_token || null;
        console.log(`   Token: ${accessToken?.substring(0, 30)}...`);
    } catch (err: any) {
        console.error('   ❌ Erreur:', err.message);
        return;
    }

    // ÉTAPE 3: Appel API sans token (doit échouer)
    console.log('\n📋 Étape 3: Test API sans token (doit être rejeté)');
    
    try {
        const responseNoAuth = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' })
        });

        if (responseNoAuth.status === 401) {
            console.log('   ✅ Correctement rejeté (401)');
        } else {
            console.warn(`   ⚠️  Statut inattendu: ${responseNoAuth.status}`);
        }
    } catch (err: any) {
        console.error('   ❌ Erreur:', err.message);
    }

    // ÉTAPE 4: Appel API avec token invalide (doit échouer)
    console.log('\n📋 Étape 4: Test API avec token invalide (doit être rejeté)');
    
    try {
        const responseInvalid = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer token_invalide_123'
            },
            body: JSON.stringify({ test: 'data' })
        });

        if (responseInvalid.status === 401) {
            console.log('   ✅ Correctement rejeté (401)');
        } else {
            console.warn(`   ⚠️  Statut inattendu: ${responseInvalid.status}`);
        }
    } catch (err: any) {
        console.error('   ❌ Erreur:', err.message);
    }

    // ÉTAPE 5: Appel API avec token valide (lecture publique)
    console.log('\n📋 Étape 5: Test API GET /vehicles (public)');
    
    try {
        const responsePublic = await fetch(`${API_URL}/vehicles`);

        if (responsePublic.ok) {
            const data = await responsePublic.json();
            console.log('   ✅ Accès public OK');
            console.log(`   ${Array.isArray(data) ? data.length : 0} véhicules trouvés`);
        } else {
            console.error(`   ❌ Erreur: ${responsePublic.status}`);
        }
    } catch (err: any) {
        console.error('   ❌ Erreur:', err.message);
    }

    // ÉTAPE 6: Appel API protégé avec token valide (doit fonctionner ou 403 si pas les droits)
    console.log('\n📋 Étape 6: Test API POST /vehicles (protégé) avec token valide');
    
    if (!accessToken) {
        console.log('   ⚠️  Pas de token disponible, test ignoré');
    } else {
        try {
            const responseProtected = await fetch(`${API_URL}/vehicles`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    immatriculation: 'TEST-001',
                    marque: 'Test',
                    modele: 'Test',
                    annee: 2024
                })
            });

            if (responseProtected.status === 201) {
                console.log('   ✅ Création réussie');
            } else if (responseProtected.status === 403) {
                console.log('   ✅ Auth OK mais permissions insuffisantes (403) - comportement correct');
            } else {
                const errorData = await responseProtected.json().catch(() => ({}));
                console.log(`   ℹ️  Statut: ${responseProtected.status} - ${errorData.error || 'Voir détails'}`);
            }
        } catch (err: any) {
            console.error('   ❌ Erreur:', err.message);
        }
    }

    // Nettoyage
    console.log('\n📋 Nettoyage');
    try {
        await supabase.auth.signOut();
        console.log('   ✅ Déconnexion effectuée');
    } catch {
        // Ignore
    }

    console.log('\n================================');
    console.log('🏁 Tests terminés');
}

// Vérifier que le serveur est démarré
console.log('⏳ Vérification du serveur API...');
fetch(`${API_URL}/health`)
    .then(() => {
        console.log('✅ Serveur API détecté\n');
        testAuthFlow();
    })
    .catch(() => {
        console.error('❌ Serveur API non détecté sur', API_URL);
        console.log('   Démarrez le serveur: npm run dev (dans apps/api)');
        process.exit(1);
    });
