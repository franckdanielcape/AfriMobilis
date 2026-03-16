/**
 * Hook pour détecter l'état du réseau
 */
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetwork() {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
    const [connectionType, setConnectionType] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setIsConnected(state.isConnected);
            setIsInternetReachable(state.isInternetReachable);
            setConnectionType(state.type);
        });

        // Vérification initiale
        NetInfo.fetch().then((state) => {
            setIsConnected(state.isConnected);
            setIsInternetReachable(state.isInternetReachable);
            setConnectionType(state.type);
        });

        return () => unsubscribe();
    }, []);

    return {
        isConnected,
        isInternetReachable,
        connectionType,
        isOffline: !isConnected,
    };
}
