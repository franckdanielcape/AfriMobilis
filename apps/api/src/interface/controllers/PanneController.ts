import { Request, Response } from 'express';
import { GetPannesUseCase, CreatePanneUseCase } from '../../application/useCases/panne/PanneUseCases';
import { PanneRepository } from '../../infrastructure/repositories/PanneRepository';

const panneRepository = new PanneRepository();
const getPannesUseCase = new GetPannesUseCase(panneRepository);
const createPanneUseCase = new CreatePanneUseCase(panneRepository);

export class PanneController {
    static async getPannes(req: Request, res: Response) {
        try {
            const pannes = await getPannesUseCase.execute();
            res.status(200).json(pannes);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createPanne(req: Request, res: Response) {
        try {
            const newPanne = await createPanneUseCase.execute(req.body);
            res.status(201).json(newPanne);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
