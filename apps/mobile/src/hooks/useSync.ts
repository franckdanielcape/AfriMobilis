/**
 * Hook pour gérer la synchronisation
 */
import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/sync';
import { useNetwork } from './useNetwork';

interface SyncState {
    isSyncing: boolean;
    pendingCount: number;
    lastSync: Date | null;
}

export function useSync() {
    const [state, setState] = useState<SyncState>({
        isSyncing: false,
        pendingCount: 0,
        lastSync: null,
    });
    const { isConnected } = useNetwork();

    const refreshState = useCallback(async () => {
        const [pendingCount, lastSync] = await Promise.all([
            syncService.getPendingCount(),
            syncService.getLastSync(),
        ]);
        setState(prev => ({ ...prev, pendingCount, lastSync }));
    }, []);

    const sync = useCallback(async () => {
        if (!isConnected || state.isSyncing) return;

        setState(prev => ({ ...prev, isSyncing: true }));
        try {
            await syncService.sync();
            await refreshState();
        } finally {
            setState(prev => ({ ...prev, isSyncing: false }));
        }
    }, [isConnected, state.isSyncing, refreshState]);

    useEffect(() => {
        refreshState();

        // Rafraîchir toutes les 5 secondes
        const interval = setInterval(refreshState, 5000);
        return () => clearInterval(interval);
    }, [refreshState]);

    useEffect(() => {
        // Synchroniser automatiquement quand on revient online
        if (isConnected && state.pendingCount > 0) {
            sync();
        }
    }, [isConnected, state.pendingCount, sync]);

    return {
        ...state,
        sync,
        refreshState,
        isOnline: isConnected,
    };
}
