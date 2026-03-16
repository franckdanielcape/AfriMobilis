import { IVehicleRepository } from '../../../infrastructure/repositories/VehicleRepository';
import { Vehicle, CreateVehicleDTO } from '../../../domain/entities/Vehicle';

export class GetVehiclesUseCase {
    constructor(private vehicleRepo: IVehicleRepository) { }

    async execute(): Promise<Vehicle[]> {
        return this.vehicleRepo.findAll();
    }
}

export class CreateVehicleUseCase {
    constructor(private vehicleRepo: IVehicleRepository) { }

    async execute(dto: CreateVehicleDTO): Promise<Vehicle> {
        if (!dto.immatriculation) {
            throw new Error("L'immatriculation est obligatoire.");
        }
        return this.vehicleRepo.create(dto);
    }
}

export class GetVehicleByPlaqueUseCase {
    constructor(private vehicleRepo: IVehicleRepository) { }

    async execute(plaque: string): Promise<Vehicle | null> {
        if (!plaque || plaque.trim() === '') {
            throw new Error("La plaque d'immatriculation est obligatoire.");
        }
        return this.vehicleRepo.findByPlaque(plaque);
    }
}
