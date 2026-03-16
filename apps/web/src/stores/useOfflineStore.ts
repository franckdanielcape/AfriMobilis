import { create } from 'zustand';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AfriMobilisDB extends DBSchema {
    syncQueue: {
        key: string;
        value: {
            key: string;
            action: string;
            payload: Record<string, unknown>;
            timestamp: number;
        };
    };
    cache: {
        key: string;
        value: unknown;
    };
}

let dbPromise: Promise<IDBPDatabase<AfriMobilisDB>> | null = null;
if (typeof window !== 'undefined') {
    dbPromise = openDB<AfriMobilisDB>('afrimobilis-db', 1, {
        upgrade(db) {
            db.createObjectStore('syncQueue', { keyPath: 'key' });
            db.createObjectStore('cache');
        },
    });
}

interface OfflineState {
    isOnline: boolean;
    setOnlineStatus: (status: boolean) => void;
    addToSyncQueue: (action: string, payload: Record<string, unknown>) => Promise<void>;
    processSyncQueue: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

    setOnlineStatus: (status) => set({ isOnline: status }),

    addToSyncQueue: async (action, payload) => {
        if (!dbPromise) return;
        const db = await dbPromise;
        const key = `${action}_${Date.now()}`;
        await db.put('syncQueue', {
            key,
            action,
            payload,
            timestamp: Date.now(),
        });
        // Log supprimé en production - utiliser logger.ts si besoin
    },

    processSyncQueue: async () => {
        if (!dbPromise || !get().isOnline) return;
        const db = await dbPromise;
        const items = await db.getAll('syncQueue');

        if (items.length === 0) return;
        // Log supprimé en production

        for (const item of items) {
            try {
                // Implement sync logic based on action here, e.g. API requests
                // Log supprimé en production
                await db.delete('syncQueue', item.key);
            } catch (error) {
                // Error log supprimé - gérer via système de monitoring si besoin
                // Stop processing on first error to maintain order, or handle it specific to the logic
                break;
            }
        }
    }
}));

// Setup event listeners for online/offline events
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        useOfflineStore.getState().setOnlineStatus(true);
        useOfflineStore.getState().processSyncQueue();
    });
    window.addEventListener('offline', () => {
        useOfflineStore.getState().setOnlineStatus(false);
    });
}
