import { useState, useEffect, useCallback } from 'react';
import { getVehiculesByProprietaire, getAffectationsActives } from '../lib/supabase';
import type { Vehicule } from '../types';

export const useVehicules = (proprietaireId: string | undefined) => {
    const [vehicules, setVehicules] = useState<Vehicule[]>([]);
    const [affectations, setAffectations] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicules = useCallback(async () => {
        if (!proprietaireId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getVehiculesByProprietaire(proprietaireId);
            setVehicules(data);

            // Fetch affectations for these vehicules
            const vehiculeIds = data.map(v => v.id);
            const affData = await getAffectationsActives(vehiculeIds);
            setAffectations(affData);
        } catch (err) {
            console.error('Error fetching vehicules:', err);
            setError('Erreur lors du chargement des véhicules');
        } finally {
            setLoading(false);
        }
    }, [proprietaireId]);

    useEffect(() => {
        fetchVehicules();
    }, [fetchVehicules]);

    const refresh = useCallback(() => {
        fetchVehicules();
    }, [fetchVehicules]);

    return {
        vehicules,
        affectations,
        loading,
        error,
        refresh,
    };
};

export default useVehicules;
