import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../config/supabase';
import { UserRole } from '../../domain/entities/Role';

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                telephone?: string;
                role?: UserRole;
                syndicat_id?: string;
            };
        }
    }
}

/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer dans le header Authorization
 */
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token d\'authentification manquant' });
            return;
        }

        const token = authHeader.substring(7);

        // Vérifier le token avec Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Token invalide ou expiré' });
            return;
        }

        // Récupérer le profil utilisateur (role, syndicat_id, telephone)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, syndicat_id, telephone')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('[Auth] Profil non trouvé pour l\'utilisateur:', user.id);
        }

        // Attacher l'utilisateur à la requête
        req.user = {
            id: user.id,
            email: user.email,
            telephone: profile?.telephone,
            role: profile?.role as UserRole,
            syndicat_id: profile?.syndicat_id,
        };

        next();
    } catch (error: any) {
        console.error('[Auth Middleware Error]:', error);
        res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};

/**
 * Middleware de vérification des rôles
 * @param roles - Liste des rôles autorisés
 */
export const requireRole = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Non authentifié' });
            return;
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            res.status(403).json({ 
                error: 'Accès refusé',
                required: roles,
                current: req.user.role 
            });
            return;
        }

        next();
    };
};

/**
 * Middleware optionnel - n'échoue pas si pas de token
 * Utile pour les routes publiques qui peuvent avoir des comportements différents selon l'auth
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && user) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role, syndicat_id, telephone')
                .eq('id', user.id)
                .single();

            req.user = {
                id: user.id,
                email: user.email,
                telephone: profile?.telephone,
                role: profile?.role as UserRole,
                syndicat_id: profile?.syndicat_id,
            };
        }

        next();
    } catch {
        next();
    }
};
