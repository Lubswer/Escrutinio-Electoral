import { NetworkError, ValidationError } from '@shared/domain/errors/AppError';
import { isDeviceOnline } from '@shared/infrastructure/network/networkMonitor';
import { Acta, SaveActaInput } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';
import { assertActaCuadratura } from '../../domain/rules/validateActaCuadratura';

/**
 * RF-09, RF-10, RF-11, RF-12, RF-13, RF-14, S-04, S-05:
 * Valida la cuadratura aritmética, exige foto y GPS, y guarda en Supabase
 * o encola localmente si el dispositivo está en zona sin cobertura.
 */
export class SaveActaUseCase {
  constructor(private readonly actaRepo: IActaRepository) {}

  async execute(input: SaveActaInput): Promise<Acta> {
    if (!input.localPhotoUri) {
      throw new ValidationError('Debes adjuntar la fotografía nítida del acta (RF-11).');
    }

    if (input.latitud === 0 && input.longitud === 0) {
      throw new ValidationError('Debes capturar la ubicación GPS del recinto antes de enviar.');
    }

    assertActaCuadratura({
      totalSufragantes: input.totalSufragantes,
      votosBlancos: input.votosBlancos,
      votosNulos: input.votosNulos,
      votosPorCandidato: input.votosPorCandidato,
    });

    const online = await isDeviceOnline();
    if (!online) {
      return this.actaRepo.enqueuePendingActa(input);
    }

    try {
      return await this.actaRepo.saveActaRemote(input);
    } catch (error) {
      if (error instanceof NetworkError) {
        return this.actaRepo.enqueuePendingActa(input, error.message);
      }
      throw error;
    }
  }
}
