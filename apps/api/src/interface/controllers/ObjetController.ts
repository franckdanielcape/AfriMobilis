import { Request, Response } from 'express';
import { GetObjetsUseCase, CreateObjetUseCase } from '../../application/useCases/objet/ObjetUseCases';
import { ObjetRepository } from '../../infrastructure/repositories/ObjetRepository';

const objetRepository = new ObjetRepository();
const getObjetsUseCase = new GetObjetsUseCase(objetRepository);
const createObjetUseCase = new CreateObjetUseCase(objetRepository);

export class ObjetController {
    static async getObjets(req: Request, res: Response) {
        try {
            const objets = await getObjetsUseCase.execute();
            res.status(200).json(objets);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createObjet(req: Request, res: Response) {
        try {
            const newObjet = await createObjetUseCase.execute(req.body);
            res.status(201).json(newObjet);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
