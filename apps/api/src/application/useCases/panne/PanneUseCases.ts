import { IPanneRepository } from '../../../infrastructure/repositories/PanneRepository';
import { Panne, CreatePanneDTO } from '../../../domain/entities/Panne';

export class GetPannesUseCase {
    constructor(private panneRepo: IPanneRepository) { }

    async execute(): Promise<Panne[]> {
        return this.panneRepo.findAll();
    }
}

export class CreatePanneUseCase {
    constructor(private panneRepo: IPanneRepository) { }

    async execute(dto: CreatePanneDTO): Promise<Panne> {
        if (!dto.vehicule_id || !dto.type_panne) {
            throw new Error("L'ID du véhicule et le type de panne sont obligatoires.");
        }
        return this.panneRepo.create(dto);
    }
}
