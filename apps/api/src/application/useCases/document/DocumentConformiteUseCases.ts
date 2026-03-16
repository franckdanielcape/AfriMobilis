import { IDocumentConformiteRepository } from '../../../infrastructure/repositories/DocumentConformiteRepository';
import { DocumentConformite, CreateDocumentConformiteDTO } from '../../../domain/entities/DocumentConformite';

export class GetDocumentsConformiteUseCase {
    constructor(private docRepo: IDocumentConformiteRepository) { }

    async execute(): Promise<DocumentConformite[]> {
        return this.docRepo.findAll();
    }
}

export class CreateDocumentConformiteUseCase {
    constructor(private docRepo: IDocumentConformiteRepository) { }

    async execute(dto: CreateDocumentConformiteDTO): Promise<DocumentConformite> {
        if (!dto.vehicule_id || !dto.type_document || !dto.date_expiration) {
            throw new Error("L'ID véhicule, le type et la date d'expiration sont obligatoires.");
        }
        return this.docRepo.create(dto);
    }
}
