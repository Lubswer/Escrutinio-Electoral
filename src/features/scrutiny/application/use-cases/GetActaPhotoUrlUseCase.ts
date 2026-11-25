import { IActaRepository } from '../../domain/repositories/IActaRepository';

export class GetActaPhotoUrlUseCase {
  constructor(private readonly actaRepo: IActaRepository) {}

  async execute(fotoPath: string): Promise<string | null> {
    if (!fotoPath) return null;
    if (fotoPath.startsWith('file://') || fotoPath.startsWith('http')) {
      return fotoPath;
    }
    return this.actaRepo.getPhotoUrl(fotoPath);
  }
}
