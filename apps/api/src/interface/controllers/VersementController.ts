import { Request, Response } from 'express';
import { GetVersementsUseCase, CreateVersementUseCase } from '../../application/useCases/versement/VersementUseCases';
import { VersementRepository } from '../../infrastructure/repositories/VersementRepository';

const versementRepository = new VersementRepository();
const getVersementsUseCase = new GetVersementsUseCase(versementRepository);
const createVersementUseCase = new CreateVersementUseCase(versementRepository);

export class VersementController {
    static async getVersements(req: Request, res: Response) {
        try {
            const versements = await getVersementsUseCase.execute();
            res.status(200).json(versements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createVersement(req: Request, res: Response) {
        try {
            const newVersement = await createVersementUseCase.execute(req.body);
            res.status(201).json(newVersement);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
