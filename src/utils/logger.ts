/**
 * Logger utilitaire pour AfriMobilis
 * Affiche les logs uniquement en développement
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    log: (...args: unknown[]): void => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.log(...args);
        }
    },
    error: (...args: unknown[]): void => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.error(...args);
        }
    },
    warn: (...args: unknown[]): void => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.warn(...args);
        }
    },
    info: (...args: unknown[]): void => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.info(...args);
        }
    },
};

/**
 * Wrapper pour supprimer les console.log en production
 * Utiliser ce wrapper pour tous les appels console
 */
export function safeLog(action: string, message: string, data?: unknown): void {
    logger.log(`[${action}] ${message}`, data ?? '');
}

export function safeError(action: string, error: unknown): void {
    if (error instanceof Error) {
        logger.error(`[${action}]`, error.message);
    } else {
        logger.error(`[${action}]`, error);
    }
}
