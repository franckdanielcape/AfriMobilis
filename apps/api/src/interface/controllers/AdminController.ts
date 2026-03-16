import { Request, Response } from 'express';
import { GetDemoViewUseCase } from '../../application/useCases/admin/GetDemoViewUseCase';

const getDemoViewUseCase = new GetDemoViewUseCase();

export class AdminController {
    static async getDemoData(req: Request, res: Response) {
        try {
            const { role } = req.params;
            const data = await getDemoViewUseCase.execute(role);
            res.status(200).json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
