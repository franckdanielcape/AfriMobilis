#!/usr/bin/env node
/**
 * Script de vérification de la connexion Supabase
 * Usage: node scripts/verify-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqtzxijhqxnpwchgoshm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdHp4aWpocXhucHdjaGdvc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTAyMzYsImV4cCI6MjA4NzcyNjIzNn0.-7JMEiP-iNDQs5U1TyLar7TgDb6HhVZkJwVBAS-qFvo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConnection() {
    console.log('🔍 Vérification de la connexion Supabase...\n');
    
    try {
        // 1. Vérifier les tables
        console.log('📋 Tables disponibles:');
        const tables = ['profiles', 'syndicats', 'vehicules', 'documents_conformite'];
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            } else {
                const count = data?.length ?? 0;
                console.log(`   ✅ ${table}: accessible`);
            }
        }
        
        // 2. Vérifier le syndicat Grand-Bassam
        console.log('\n🏛️  Syndicat Grand-Bassam:');
        const { data: syndicat, error: syndError } = await supabase
            .from('syndicats')
            .select('*')
            .eq('code', 'GRA')
            .single();
        
        if (syndError) {
            console.log(`   ❌ ${syndError.message}`);
        } else if (syndicat) {
            console.log(`   ✅ ${syndicat.nom}`);
            console.log(`      Code: ${syndicat.code}`);
            console.log(`      Zone: ${syndicat.zone}`);
        } else {
            console.log('   ⚠️  Syndicat non trouvé');
        }
        
        // 3. Vérifier le Super Admin
        console.log('\n👤 Super Admin:');
        const { data: admin, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, role, nom, prenom')
            .eq('role', 'super_admin')
            .single();
        
        if (adminError) {
            console.log(`   ❌ ${adminError.message}`);
        } else if (admin) {
            console.log(`   ✅ ${admin.prenom} ${admin.nom}`);
            console.log(`      Email: ${admin.email}`);
            console.log(`      Role: ${admin.role}`);
        } else {
            console.log('   ⚠️  Super Admin non trouvé');
        }
        
        console.log('\n✅ Vérification terminée!');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

verifyConnection();
