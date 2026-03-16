/**
 * Middleware de validation
 * Validation des données entrantes
 */
import { Request, Response, NextFunction } from 'express';

interface ValidationSchema {
    body?: Record<string, any>;
    query?: Record<string, any>;
    params?: Record<string, any>;
}

export const validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Simple validation - can be enhanced with Zod if installed
        try {
            // Check required body fields
            if (schema.body) {
                for (const [key, value] of Object.entries(schema.body)) {
                    if (value?.required && !req.body[key]) {
                        return res.status(400).json({
                            error: 'Validation failed',
                            details: [{ path: `body.${key}`, message: `${key} is required` }],
                        });
                    }
                }
            }
            next();
        } catch (error: any) {
            return res.status(400).json({
                error: 'Validation failed',
                message: error.message,
            });
        }
    };
};

// Schémas de validation communs
export const schemas = {
    vehicle: {
        create: {
            body: {
                immatriculation: { required: true },
                marque: { required: true },
                modele: { required: true },
                syndicat_id: { required: true },
                ligne_id: { required: true },
                proprietaire_id: { required: true },
            },
        },
    },
    panne: {
        create: {
            body: {
                vehicule_id: { required: true },
                type_panne: { required: true },
            },
        },
    },
    versement: {
        create: {
            body: {
                montant_attendu: { required: true },
                date_echeance: { required: true },
            },
        },
    },
};
