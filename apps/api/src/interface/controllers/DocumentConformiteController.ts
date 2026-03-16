import { Request, Response } from 'express';
import { GetDocumentsConformiteUseCase, CreateDocumentConformiteUseCase } from '../../application/useCases/document/DocumentConformiteUseCases';
import { DocumentConformiteRepository } from '../../infrastructure/repositories/DocumentConformiteRepository';

const docRepository = new DocumentConformiteRepository();
const getDocsUseCase = new GetDocumentsConformiteUseCase(docRepository);
const createDocUseCase = new CreateDocumentConformiteUseCase(docRepository);

export class DocumentConformiteController {
    static async getDocuments(req: Request, res: Response) {
        try {
            const docs = await getDocsUseCase.execute();
            res.status(200).json(docs);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createDocument(req: Request, res: Response) {
        try {
            const newDoc = await createDocUseCase.execute(req.body);
            res.status(201).json(newDoc);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
