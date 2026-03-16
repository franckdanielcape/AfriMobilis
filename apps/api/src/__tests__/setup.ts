/**
 * Configuration des tests
 */

// Mock des variables d'environnement
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock console pour les tests
global.console = {
    ...console,
    // Réduire le bruit dans les tests
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    // Garder les erreurs
    error: console.error,
    warn: console.warn,
};

// Nettoyer après chaque test
afterEach(() => {
    jest.clearAllMocks();
});
