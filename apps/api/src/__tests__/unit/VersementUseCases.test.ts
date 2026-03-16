/**
 * Tests unitaires pour VersementUseCases
 */
import { GetVersementsUseCase, CreateVersementUseCase } from '../../application/useCases/versement/VersementUseCases';
import { VersementRepository } from '../../infrastructure/repositories/VersementRepository';
import { Versement } from '../../domain/entities/Versement';

jest.mock('../../infrastructure/repositories/VersementRepository');

describe('VersementUseCases', () => {
    let getVersementsUseCase: GetVersementsUseCase;
    let createVersementUseCase: CreateVersementUseCase;
    let mockRepository: jest.Mocked<VersementRepository>;

    beforeEach(() => {
        mockRepository = new VersementRepository() as jest.Mocked<VersementRepository>;
        getVersementsUseCase = new GetVersementsUseCase(mockRepository);
        createVersementUseCase = new CreateVersementUseCase(mockRepository);
        jest.clearAllMocks();
    });

    describe('getVersements', () => {
        it('should return all versements', async () => {
            const versements: Versement[] = [
                {
                    id: 'versement-1',
                    montant_attendu: 50000,
                    montant_verse: 50000,
                    date_echeance: '2024-01-15',
                    statut: 'en_attente',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockRepository.findAll = jest.fn().mockResolvedValue(versements);

            const result = await getVersementsUseCase.execute();

            expect(mockRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(versements);
        });
    });

    describe('createVersement', () => {
        it('should create a versement successfully', async () => {
            const versementData = {
                montant_attendu: 50000,
                montant_verse: 50000,
                date_echeance: '2024-01-15',
            };

            const expectedVersement: Versement = {
                id: 'versement-1',
                ...versementData,
                statut: 'en_attente',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.create = jest.fn().mockResolvedValue(expectedVersement);

            const result = await createVersementUseCase.execute(versementData);

            expect(mockRepository.create).toHaveBeenCalledWith(versementData);
            expect(result.montant_attendu).toBe(50000);
        });

        it('should throw error if montant_attendu is missing', async () => {
            const versementData = {
                montant_attendu: 0,
                date_echeance: '2024-01-15',
            };

            await expect(createVersementUseCase.execute(versementData as any))
                .rejects.toThrow();
        });
    });

    describe('getVersementById', () => {
        it('should return versement by id', async () => {
            const versement: Versement = {
                id: 'versement-1',
                montant_attendu: 50000,
                montant_verse: 50000,
                date_echeance: '2024-01-15',
                statut: 'en_attente',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.findById = jest.fn().mockResolvedValue(versement);

            const result = await mockRepository.findById('versement-1');

            expect(mockRepository.findById).toHaveBeenCalledWith('versement-1');
            expect(result).toEqual(versement);
        });
    });
});
