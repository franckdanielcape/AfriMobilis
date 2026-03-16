import { Request, Response } from 'express';
import { GetVehiclesUseCase, CreateVehicleUseCase, GetVehicleByPlaqueUseCase } from '../../application/useCases/vehicle/VehicleUseCases';
import { VehicleRepository } from '../../infrastructure/repositories/VehicleRepository';

// Basic dependency injection
const vehicleRepository = new VehicleRepository();
const getVehiclesUseCase = new GetVehiclesUseCase(vehicleRepository);
const createVehicleUseCase = new CreateVehicleUseCase(vehicleRepository);
const getVehicleByPlaqueUseCase = new GetVehicleByPlaqueUseCase(vehicleRepository);

export class VehicleController {
    static async getVehicles(req: Request, res: Response) {
        try {
            const vehicles = await getVehiclesUseCase.execute();
            res.status(200).json(vehicles);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createVehicle(req: Request, res: Response) {
        try {
            const newVehicle = await createVehicleUseCase.execute(req.body);
            res.status(201).json(newVehicle);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getVehicleByPlaque(req: Request, res: Response) {
        try {
            const { plaque } = req.params;
            const vehicle = await getVehicleByPlaqueUseCase.execute(plaque);
            
            if (!vehicle) {
                return res.status(404).json({ 
                    error: 'Véhicule non trouvé',
                    message: `Aucun véhicule trouvé avec la plaque ${plaque}`
                });
            }
            
            res.status(200).json(vehicle);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
