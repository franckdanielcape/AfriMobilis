/**
 * Service de cache Redis pour l'API AfriMobilis
 * Fournit le caching des données fréquemment accédées
 * 
 * NOTE: Redis est optionnel. Si le module n'est pas installé,
 * le service fonctionne en mode dégradé (pas de cache).
 */

export class RedisCache {
    private client: any | null = null;
    private static instance: RedisCache;
    private isConnected = false;

    private constructor() {}

    static getInstance(): RedisCache {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            // Dynamic import to avoid errors if redis is not installed
            const redisModule = await import('redis').catch(() => null);
            if (!redisModule) {
                console.log('[Redis] Module not installed, running without cache');
                return;
            }
            
            const { createClient } = redisModule;
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = createClient({ url: redisUrl });

            this.client.on('error', (err: any) => {
                console.error('[Redis] Error:', err);
            });

            this.client.on('connect', () => {
                console.log('[Redis] Connected successfully');
            });

            await this.client.connect();
            this.isConnected = true;
        } catch (error) {
            console.error('[Redis] Failed to connect:', error);
            // Continue without cache
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.client || !this.isConnected) return null;

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('[Redis] Get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('[Redis] Set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            await this.client.del(key);
        } catch (error) {
            console.error('[Redis] Delete error:', error);
        }
    }

    async deletePattern(pattern: string): Promise<void> {
        if (!this.client || !this.isConnected) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error('[Redis] Delete pattern error:', error);
        }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.client || !this.isConnected) return false;

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('[Redis] Exists error:', error);
            return false;
        }
    }

    // Cache spécifique pour les véhicules
    async getVehicle(id: string): Promise<any | null> {
        return this.get(`vehicle:${id}`);
    }

    async setVehicle(id: string, data: any): Promise<void> {
        return this.set(`vehicle:${id}`, data, 600); // 10 minutes
    }

    async invalidateVehicle(id: string): Promise<void> {
        await this.delete(`vehicle:${id}`);
        await this.deletePattern('vehicles:list:*');
    }

    // Rate limiting
    async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
        if (!this.client || !this.isConnected) return 0;

        try {
            const multi = this.client.multi();
            multi.incr(key);
            multi.expire(key, windowSeconds);
            const results = await multi.exec();
            return results ? (results[0] as number) : 0;
        } catch (error) {
            console.error('[Redis] Rate limit error:', error);
            return 0;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

// Export singleton instance
export const cache = RedisCache.getInstance();
