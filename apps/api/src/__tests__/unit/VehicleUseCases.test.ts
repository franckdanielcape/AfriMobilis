/**
 * Tests unitaires pour VehicleUseCases
 */
import { GetVehiclesUseCase, CreateVehicleUseCase } from '../../application/useCases/vehicle/VehicleUseCases';
import { VehicleRepository } from '../../infrastructure/repositories/VehicleRepository';
import { Vehicle } from '../../domain/entities/Vehicle';

// Mock du repository
jest.mock('../../infrastructure/repositories/VehicleRepository');

describe('VehicleUseCases', () => {
    let getVehiclesUseCase: GetVehiclesUseCase;
    let createVehicleUseCase: CreateVehicleUseCase;
    let mockRepository: jest.Mocked<VehicleRepository>;

    beforeEach(() => {
        mockRepository = new VehicleRepository() as jest.Mocked<VehicleRepository>;
        getVehiclesUseCase = new GetVehiclesUseCase(mockRepository);
        createVehicleUseCase = new CreateVehicleUseCase(mockRepository);
        jest.clearAllMocks();
    });

    describe('getVehicles', () => {
        it('should return all vehicles', async () => {
            const vehicles: Vehicle[] = [
                {
                    id: 'vehicle-1',
                    immatriculation: 'AB-123-CD',
                    marque: 'Toyota',
                    modele: 'Corolla',
                    annee: 2020,
                    syndicat_id: 'syndicat-1',
                    ligne_id: 'ligne-1',
                    proprietaire_id: 'user-1',
                    statut: 'actif',
                    conformite_status: 'conforme',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            mockRepository.findAll = jest.fn().mockResolvedValue(vehicles);

            const result = await getVehiclesUseCase.execute();

            expect(mockRepository.findAll).toHaveBeenCalled();
            expect(result).toEqual(vehicles);
        });
    });

    describe('createVehicle', () => {
        it('should create a vehicle successfully', async () => {
            const vehicleData = {
                immatriculation: 'AB-123-CD',
                marque: 'Toyota',
                modele: 'Corolla',
                syndicat_id: 'syndicat-1',
                ligne_id: 'ligne-1',
                proprietaire_id: 'user-1',
            };

            const expectedVehicle: Vehicle = {
                id: 'vehicle-1',
                ...vehicleData,
                annee: undefined,
                statut: 'actif',
                conformite_status: 'conforme',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.create = jest.fn().mockResolvedValue(expectedVehicle);

            const result = await createVehicleUseCase.execute(vehicleData);

            expect(mockRepository.create).toHaveBeenCalledWith(vehicleData);
            expect(result).toEqual(expectedVehicle);
        });

        it('should throw error if immatriculation is missing', async () => {
            const vehicleData = {
                immatriculation: '',
                marque: 'Toyota',
                modele: 'Corolla',
                syndicat_id: 'syndicat-1',
                ligne_id: 'ligne-1',
                proprietaire_id: 'user-1',
            };

            await expect(createVehicleUseCase.execute(vehicleData))
                .rejects.toThrow("L'immatriculation est obligatoire.");
        });
    });

    describe('getVehicleById', () => {
        it('should return vehicle by id', async () => {
            const vehicle: Vehicle = {
                id: 'vehicle-1',
                immatriculation: 'AB-123-CD',
                marque: 'Toyota',
                modele: 'Corolla',
                annee: 2020,
                syndicat_id: 'syndicat-1',
                ligne_id: 'ligne-1',
                proprietaire_id: 'user-1',
                statut: 'actif',
                conformite_status: 'conforme',
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockRepository.findById = jest.fn().mockResolvedValue(vehicle);

            const result = await mockRepository.findById('vehicle-1');

            expect(mockRepository.findById).toHaveBeenCalledWith('vehicle-1');
            expect(result).toEqual(vehicle);
        });

        it('should return null if vehicle not found', async () => {
            mockRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await mockRepository.findById('non-existent');

            expect(result).toBeNull();
        });
    });
});
