import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../../domain/entities/Role';

const router = Router();

/**
 * Route publique d'inscription pour les syndicats
 * Créé par Super Admin uniquement
 */
router.post('/register-syndicat', async (req, res) => {
    try {
        const { telephone, password, nom, prenom, nomSyndicat, ville } = req.body;

        // Validation
        if (!telephone || !password || !nom || !prenom || !nomSyndicat) {
            return res.status(400).json({ 
                error: 'Champs requis manquants',
                required: ['telephone', 'password', 'nom', 'prenom', 'nomSyndicat']
            });
        }

        // Convertir téléphone en email format interne
        const email = `${telephone.replace(/[^0-9]/g, '')}@afrimobilis.local`;

        // 1. Créer le syndicat d'abord
        const { data: syndicat, error: syndicatError } = await supabaseAdmin
            .from('syndicats')
            .insert({
                nom: nomSyndicat,
                ville: ville || 'Grand-Bassam',
                statut: 'actif'
            })
            .select()
            .single();

        if (syndicatError) {
            console.error('Erreur création syndicat:', syndicatError);
            return res.status(500).json({ 
                error: 'Erreur lors de la création du syndicat',
                details: syndicatError.message 
            });
        }

        // 2. Créer l'utilisateur dans Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                nom,
                prenom,
                telephone,
                role: 'chef_ligne'
            }
        });

        if (authError) {
            await supabaseAdmin.from('syndicats').delete().eq('id', syndicat.id);
            console.error('Erreur création auth:', authError);
            return res.status(400).json({ 
                error: 'Erreur lors de la création du compte',
                details: authError.message 
            });
        }

        // 3. Créer le profil
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                email,
                telephone,
                nom,
                prenom,
                role: 'chef_ligne',
                syndicat_id: syndicat.id,
                statut: 'actif'
            });

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            await supabaseAdmin.from('syndicats').delete().eq('id', syndicat.id);
            console.error('Erreur création profil:', profileError);
            return res.status(500).json({ 
                error: 'Erreur lors de la création du profil',
                details: profileError.message 
            });
        }

        return res.status(201).json({
            message: 'Compte créé avec succès',
            user: {
                id: authData.user.id,
                telephone,
                nom,
                prenom,
                role: 'chef_ligne'
            },
            syndicat: {
                id: syndicat.id,
                nom: nomSyndicat
            }
        });

    } catch (error: any) {
        console.error('Erreur inscription:', error);
        return res.status(500).json({ 
            error: 'Erreur serveur',
            details: error.message 
        });
    }
});

/**
 * Route protégée pour créer un compte propriétaire (par Chef de Ligne)
 * Nécessite authentification et rôle chef_ligne ou super_admin
 */
router.post('/register-proprietaire', 
    authenticateToken,
    requireRole(UserRole.SUPER_ADMIN, UserRole.CHEF_LIGNE),
    async (req, res) => {
        try {
            const { nom, prenom, telephone, role, vehicule_id } = req.body;

            if (!nom || !prenom || !telephone || !role || !vehicule_id) {
                return res.status(400).json({ 
                    error: 'Champs requis manquants',
                    required: ['nom', 'prenom', 'telephone', 'role', 'vehicule_id']
                });
            }

            // Générer un mot de passe temporaire
            const tempPassword = Math.random().toString(36).slice(-8);
            const email = `${telephone.replace(/[^0-9]/g, '')}@afrimobilis.local`;
            
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    nom,
                    prenom,
                    telephone,
                    role
                }
            });

            if (authError) {
                return res.status(400).json({ 
                    error: 'Erreur création compte',
                    details: authError.message 
                });
            }

            // Créer le profil
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email,
                    telephone,
                    nom,
                    prenom,
                    role,
                    statut: 'en_attente_confirmation'
                })
                .select()
                .single();

            if (profileError) {
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                return res.status(500).json({ 
                    error: 'Erreur création profil',
                    details: profileError.message
                });
            }

            // Mettre à jour le véhicule avec le propriétaire
            const { error: vehiculeError } = await supabaseAdmin
                .from('vehicules')
                .update({ 
                    proprietaire_id: authData.user.id,
                    statut: 'en_attente_documents'
                })
                .eq('id', vehicule_id);

            if (vehiculeError) {
                console.error('Erreur mise à jour véhicule:', vehiculeError);
            }

            return res.status(201).json({
                message: 'Compte propriétaire créé avec succès',
                user: {
                    id: authData.user.id,
                    nom,
                    prenom,
                    telephone,
                    role
                },
                accessTemp: {
                    telephone,
                    password: tempPassword
                },
                vehicule_id
            });

        } catch (error: any) {
            console.error('Erreur inscription propriétaire:', error);
            return res.status(500).json({ error: error.message });
        }
    }
);

export { router as authRoutes };
