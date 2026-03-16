import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setSuperAdmin() {
    console.log("Recherche de l'utilisateur franckdanielcape@gmail.com...");

    // Step 1: Find user ID by email via admin auth API
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Erreur de récupération des utilisateurs Auth:", authError);
        return;
    }

    const user = users.users.find(u => u.email === 'franckdanielcape@gmail.com');
    if (!user) {
        console.log("Utilisateur introuvable dans Supabase Auth.");
        return;
    }

    console.log("Utilisateur trouvé :", user.id);

    // Step 2: Update custom profiles table
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id);

    if (dbError) {
        console.error("Erreur mise à jour table users :", dbError);
    } else {
        console.log("Rôle mis à jour avec succès : super_admin !");
    }
}

setSuperAdmin();
