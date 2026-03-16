import { IVersementRepository } from '../../../infrastructure/repositories/VersementRepository';
import { Versement, CreateVersementDTO } from '../../../domain/entities/Versement';

export class GetVersementsUseCase {
    constructor(private versementRepo: IVersementRepository) { }

    async execute(): Promise<Versement[]> {
        return this.versementRepo.findAll();
    }
}

export class CreateVersementUseCase {
    constructor(private versementRepo: IVersementRepository) { }

    async execute(dto: CreateVersementDTO): Promise<Versement> {
        if (!dto.montant_attendu || !dto.date_echeance) {
            throw new Error("Montant attendu et date d'échéance sont obligatoires.");
        }
        return this.versementRepo.create(dto);
    }
}
