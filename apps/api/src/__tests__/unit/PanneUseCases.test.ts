/**
 * Tests unitaires pour PanneUseCases
 */
import { GetPannesUseCase, CreatePanneUseCase } from '../../application/useCases/panne/PanneUseCases';
import { PanneRepository } from '../../infrastructure/repositories/PanneRepository';
import { Panne } from '../../domain/entities/Panne';

// Mock du repository
jest.mock('../../infrastructure/repositories/PanneRepository');

describe('PanneUseCases', () => {
    let getPannesUseCase: GetPannesUseCase;
    let createPanneUseCase: CreatePanneUseCase;
    let mockRepository: jest.Mocked<PanneRepository>;

    beforeEach(() => {
        mockRepository = new PanneRepository() as jest.Mocked<PanneRepository>;
        getPannesUseCase = new GetPannesUseCase(mockRepository);
        createPanneUseCase = new CreatePanneUseCase(mockRepository);
        jest.clearAllMocks();
    });

    describe('getPannes', () => {
        it('should return all pannes', async () => {
            const pannes: Panne[] = [
                {
                    id: 'panne-1',
                    vehicule_id: 'vehicle-1',
                    chauffeur_id: 'chauffeur-1',
                    type_panne: 'Moteur',
                    description: 'Moteur qui fume',
                    gravite: 'critique',
                    statut: 'declaree',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockRepository.findAll = jest.fn().mockResolvedValue(pannes);

            const result = await getPannesUseCase.execute();

            expect(mockRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(pannes);
        });
    });

    describe('createPanne', () => {
        it('should create a panne successfully', async () => {
            const panneData = {
                vehicule_id: 'vehicle-1',
                chauffeur_id: 'chauffeur-1',
                type_panne: 'Moteur',
                description: 'Moteur qui fume',
                gravite: 'critique' as const,
            };

            const expectedPanne: Panne = {
                id: 'panne-1',
                ...panneData,
                statut: 'declaree',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.create = jest.fn().mockResolvedValue(expectedPanne);

            const result = await createPanneUseCase.execute(panneData);

            expect(mockRepository.create).toHaveBeenCalledWith(panneData);
            expect(result.statut).toBe('declaree');
        });

        it('should throw error if vehicule_id is missing', async () => {
            const panneData = {
                vehicule_id: '',
                type_panne: 'Moteur',
                description: 'Test',
            };

            await expect(createPanneUseCase.execute(panneData))
                .rejects.toThrow("L'ID du véhicule et le type de panne sont obligatoires.");
        });

        it('should throw error if type_panne is missing', async () => {
            const panneData = {
                vehicule_id: 'vehicle-1',
                type_panne: '',
                description: 'Test',
            };

            await expect(createPanneUseCase.execute(panneData))
                .rejects.toThrow("L'ID du véhicule et le type de panne sont obligatoires.");
        });
    });

    describe('getPanneById', () => {
        it('should return panne by id', async () => {
            const panne: Panne = {
                id: 'panne-1',
                vehicule_id: 'vehicle-1',
                chauffeur_id: 'chauffeur-1',
                type_panne: 'Moteur',
                description: 'Test',
                gravite: 'mineure',
                statut: 'declaree',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.findById = jest.fn().mockResolvedValue(panne);

            const result = await mockRepository.findById('panne-1');

            expect(mockRepository.findById).toHaveBeenCalledWith('panne-1');
            expect(result).toEqual(panne);
        });

        it('should return null if panne not found', async () => {
            mockRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await mockRepository.findById('non-existent');

            expect(result).toBeNull();
        });
    });
});
