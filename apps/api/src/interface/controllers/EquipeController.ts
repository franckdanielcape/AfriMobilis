import { Request, Response } from 'express';
import { supabaseAdmin as supabase } from '../../config/supabase';

export class EquipeController {

    // 1. Lister l'équipe locale du Chef Syndicat
    static async getEquipe(req: Request, res: Response) {
        try {
            const userId = req.query.userId as string;
            if (!userId) {
                return res.status(401).json({ error: 'Non autorisé - userId manquant' });
            }

            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('role, syndicat_id')
                .eq('id', userId)
                .single();

            if (profileError || !userProfile) {
                return res.status(404).json({ error: 'Profil introuvable' });
            }

            if (userProfile.role !== 'admin_syndicat' && userProfile.role !== 'super_admin' && userProfile.role !== 'sous_admin' && userProfile.role !== 'chef_ligne') {
                return res.status(403).json({ error: "Accès restreint à l'équipe de direction" });
            }

            const { data: members, error: membersError } = await supabase
                .from('profiles')
                .select(`id, nom, prenom, email, telephone, role, created_at`)
                .eq('syndicat_id', userProfile.syndicat_id)
                .in('role', ['sous_admin', 'chef_ligne', 'agent_terrain'])
                .order('created_at', { ascending: false });

            if (membersError) throw membersError;

            const { data: customRoles, error: rolesError } = await supabase
                .from('roles_hierarchy')
                .select('*')
                .eq('syndicat_id', userProfile.syndicat_id)
                .order('niveau', { ascending: true });

            if (rolesError) throw rolesError;

            return res.json({ equipe: members || [], roles_personnalises: customRoles || [] });

        } catch (error: any) {
            console.error('getEquipe error:', error);
            res.status(500).json({ error: 'Erreur Serveur', details: error.message });
        }
    }

    // 2. Créer un rôle personnalisé
    static async createCustomRole(req: Request, res: Response) {
        try {
            const { userId, nom, niveau, permissions } = req.body;

            if (!userId || !nom || !niveau) {
                return res.status(400).json({ error: 'userId, nom, et niveau sont requis' });
            }

            if (![3, 4].includes(niveau)) {
                return res.status(400).json({ error: 'Niveau invalide. 3 (Bureau) ou 4 (Terrain) uniquement.' });
            }

            const { data: userProfile, error: profileError } = await supabase
                .from('profiles')
                .select('role, syndicat_id')
                .eq('id', userId)
                .single();

            if (profileError || !userProfile || (userProfile.role !== 'admin_syndicat' && userProfile.role !== 'super_admin')) {
                return res.status(403).json({ error: 'Seul le Chef de Syndicat ou Super Admin peut créer des rôles personnalisés.' });
            }

            const { data: newRole, error: insertError } = await supabase
                .from('roles_hierarchy')
                .insert({
                    nom,
                    niveau,
                    permissions_json: permissions || {},
                    syndicat_id: userProfile.syndicat_id,
                    created_by: userId
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Note: La table creation_logs n'existe pas encore dans le schéma
            // await supabase.from('creation_logs').insert({
            //     created_by: userId,
            //     created_user_id: newRole.id,
            //     role_given: `CUSTOM_ROLE:${nom}`,
            //     ip_address: req.ip || 'unknown'
            // });

            return res.status(201).json(newRole);

        } catch (error: any) {
            console.error('createCustomRole error:', error);
            res.status(500).json({ error: 'Erreur Serveur', details: error.message });
        }
    }

    // 3. Créer un membre via Supabase Admin (Bypass pour contourner RLS et Auth public)
    static async createMember(req: Request, res: Response) {
        try {
            const { email, password, nom, prenom, phone, role, syndicat_id } = req.body;
            const creator_id = req.user?.id; // Récupéré depuis le middleware d'authentification

            if (!email || !password || !nom || !prenom || !role || !syndicat_id) {
                return res.status(400).json({ error: 'Champs obligatoires manquants (email, password, nom, prenom, role, syndicat_id)' });
            }

            // 1. Créer l'utilisateur dans Supabase Auth (utilisation de signUp standard car pas de vraie clé admin)
            let authId = '';
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                // If user already exists in auth, we just sign in to get their auth ID
                if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
                    const { data: signData, error: signError } = await supabase.auth.signInWithPassword({ email, password });
                    if (signError || !signData.user) {
                        return res.status(400).json({ error: 'Le compte auth existe déjà mais le mot de passe est incorrect.', details: signError?.message });
                    }
                    authId = signData.user.id;
                } else {
                    console.error("AUTH ERROR:", authError);
                    return res.status(400).json({ error: 'Erreur lors de la création du compte Auth', details: authError?.message || JSON.stringify(authError) || 'Erreur inconnue' });
                }
            } else {
                if (!authData?.user) {
                    return res.status(400).json({ error: 'Échec inattendu de Auth', details: 'No user data' });
                }
                authId = authData.user.id;
            }

            // 2. Créer le profil public dans la table profiles
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authId,
                email,
                nom,
                prenom,
                telephone: phone,
                role,
                syndicat_id,
                status: 'actif'
            });

            if (profileError) {
                // If the profile already exists, tell the user cleanly
                if (profileError.code === '23505') { // Postgres duplicate key error code
                    return res.status(400).json({ error: 'Ce profil existe déjà (conflit email ou téléphone)', details: profileError.message });
                }

                // Tentative de nettoyage si échec du profil (impossible via signUp standard public, on signale juste l'erreur)
                return res.status(400).json({ error: 'Erreur lors de la création du profil (Base de données)', details: profileError.message });
            }

            // 3. Log (désactivé - table creation_logs non créée)
            // if (creator_id) {
            //     await supabase.from('creation_logs').insert({
            //         created_by: creator_id,
            //         created_user_id: authId,
            //         role_given: role,
            //         ip_address: req.ip || 'unknown'
            //     });
            // }

            return res.status(201).json({ message: 'Compte créé avec succès', user_id: authId });
        } catch (error: any) {
            console.error('createMember error:', error);
            res.status(500).json({ error: 'Erreur Serveur', details: error.message });
        }
    }
}
