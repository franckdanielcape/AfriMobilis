import { useState, useEffect, useCallback } from 'react';
import { getChefLigneStats, getSuperAdminStats, getProprietaireStats, getChauffeurStats } from '@/lib/stats';

interface UseStatsOptions {
    role: string;
    userId?: string;
    zoneId?: string;
}

export function useStats({ role, userId, zoneId }: UseStatsOptions) {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let result;
            
            switch (role) {
                case 'super_admin':
                    result = await getSuperAdminStats();
                    break;
                case 'chef_ligne':
                case 'admin_syndicat':
                    result = await getChefLigneStats(zoneId);
                    break;
                case 'proprietaire':
                    if (!userId) throw new Error('ID propriétaire requis');
                    result = await getProprietaireStats(userId);
                    break;
                case 'chauffeur':
                    if (!userId) throw new Error('ID chauffeur requis');
                    result = await getChauffeurStats(userId);
                    break;
                default:
                    throw new Error('Rôle non supporté');
            }
            
            setData(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [role, userId, zoneId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { data, loading, error, refetch: fetchStats };
}
