/**
 * Script de vérification des variables d'environnement
 * À exécuter avant le démarrage du serveur
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Vérification de la configuration...\n');

const requiredVars = [
    { name: 'SUPABASE_URL', value: process.env.SUPABASE_URL },
    { name: 'SUPABASE_SERVICE_KEY', value: process.env.SUPABASE_SERVICE_KEY },
];

const optionalVars = [
    { name: 'PORT', value: process.env.PORT || '4000 (défaut)' },
];

let hasError = false;

for (const v of requiredVars) {
    if (!v.value || v.value.includes('...') || v.value.length < 10) {
        console.error(`❌ ${v.name}: MANQUANT ou INVALIDE`);
        hasError = true;
    } else {
        const masked = v.name.includes('KEY') 
            ? `${v.value.substring(0, 20)}...${v.value.substring(v.value.length - 4)}`
            : v.value;
        console.log(`✅ ${v.name}: ${masked}`);
    }
}

for (const v of optionalVars) {
    console.log(`✅ ${v.name}: ${v.value}`);
}

console.log('\n---');

// Vérification du type de clé
const key = process.env.SUPABASE_SERVICE_KEY || '';
if (key) {
    try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
        const role = payload.role;
        
        if (role === 'service_role') {
            console.log('✅ Clé Service Role détectée (correct pour backend)');
        } else if (role === 'anon') {
            console.warn('⚠️  Clé ANON détectée ! Vous devez utiliser la SERVICE_ROLE_KEY');
            console.log('   Récupérez-la: Supabase Dashboard > Project Settings > API > service_role key');
            hasError = true;
        } else {
            console.log(`ℹ️  Rôle détecté: ${role}`);
        }
    } catch {
        console.error('❌ Impossible de décoder la clé JWT');
        hasError = true;
    }
}

if (hasError) {
    console.log('\n❌ Configuration invalide. Corrigez les erreurs avant de démarrer.');
    process.exit(1);
} else {
    console.log('\n✅ Configuration OK. Démarrage du serveur...\n');
    process.exit(0);
}
