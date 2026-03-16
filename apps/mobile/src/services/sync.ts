/**
 * Service de synchronisation pour le mode offline
 * Gère la file d'attente des actions et la synchronisation
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
    id: string;
    type: 'versement' | 'panne' | 'profile_update';
    data: any;
    timestamp: number;
    retryCount: number;
}

const QUEUE_KEY = '@afrimobilis:syncQueue';
const LAST_SYNC_KEY = '@afrimobilis:lastSync';

class SyncService {
    private isSyncing = false;

    /**
     * Vérifier la connexion internet
     */
    async isOnline(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.isConnected === true;
    }

    /**
     * Ajouter une action à la file d'attente
     */
    async queueAction(type: QueuedAction['type'], data: any): Promise<void> {
        const queue = await this.getQueue();
        const action: QueuedAction = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };

        queue.push(action);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        // Essayer de synchroniser immédiatement si online
        const online = await this.isOnline();
        if (online) {
            this.sync();
        }
    }

    /**
     * Récupérer la file d'attente
     */
    async getQueue(): Promise<QueuedAction[]> {
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        return queueJson ? JSON.parse(queueJson) : [];
    }

    /**
     * Synchroniser les actions en attente
     */
    async sync(): Promise<{ success: number; failed: number }> {
        if (this.isSyncing) return { success: 0, failed: 0 };

        const online = await this.isOnline();
        if (!online) return { success: 0, failed: 0 };

        this.isSyncing = true;
        let success = 0;
        let failed = 0;

        try {
            const queue = await this.getQueue();
            const remaining: QueuedAction[] = [];

            for (const action of queue) {
                try {
                    await this.executeAction(action);
                    success++;
                } catch (error) {
                    action.retryCount++;
                    if (action.retryCount < 3) {
                        remaining.push(action);
                    } else {
                        failed++;
                        // Logger l'erreur pour analyse
                        console.error('[Sync] Action failed after 3 retries:', action);
                    }
                }
            }

            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
            await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        } finally {
            this.isSyncing = false;
        }

        return { success, failed };
    }

    /**
     * Exécuter une action
     */
    private async executeAction(action: QueuedAction): Promise<void> {
        switch (action.type) {
            case 'versement':
                await apiService.createVersement(action.data);
                break;
            case 'panne':
                await apiService.declarePanne(action.data);
                break;
            case 'profile_update':
                await apiService.updateProfile(action.data.userId, action.data.updates);
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }

    /**
     * Récupérer la date de dernière synchronisation
     */
    async getLastSync(): Promise<Date | null> {
        const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
        return timestamp ? new Date(parseInt(timestamp)) : null;
    }

    /**
     * Vider la file d'attente
     */
    async clearQueue(): Promise<void> {
        await AsyncStorage.removeItem(QUEUE_KEY);
    }

    /**
     * Nombre d'actions en attente
     */
    async getPendingCount(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }
}

export const syncService = new SyncService();
