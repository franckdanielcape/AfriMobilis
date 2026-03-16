import { Request, Response } from 'express';
import { GetSyndicatsUseCase, CreateSyndicatUseCase } from '../../application/useCases/syndicat/SyndicatUseCases';
import { SyndicatRepository } from '../../infrastructure/repositories/SyndicatRepository';

const syndicatRepository = new SyndicatRepository();
const getSyndicatsUseCase = new GetSyndicatsUseCase(syndicatRepository);
const createSyndicatUseCase = new CreateSyndicatUseCase(syndicatRepository);

export class SyndicatController {
    static async getSyndicats(req: Request, res: Response) {
        try {
            const syndicats = await getSyndicatsUseCase.execute();
            res.status(200).json(syndicats);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createSyndicat(req: Request, res: Response) {
        try {
            const newSyndicat = await createSyndicatUseCase.execute(req.body);
            res.status(201).json(newSyndicat);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
