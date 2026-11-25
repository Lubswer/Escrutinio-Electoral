import { NetworkError, ValidationError } from '@shared/domain/errors/AppError';
import { INetworkStatusService } from '@shared/domain/services/INetworkStatusService';
import { Acta, SaveActaInput } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';
import { IOfflineActaQueueRepository } from '../../domain/repositories/IOfflineActaQueueRepository';
import { assertActaCuadratura } from '../../domain/rules/validateActaCuadratura';

/**
 * RF-09, RF-10, RF-11, RF-12, RF-13, RF-14, S-04, S-05:
 * Valida la cuadratura aritmética, exige foto y GPS, y guarda en Supabase
 * o encola localmente en AsyncStorage si el dispositivo está sin cobertura.
 */
export class SaveActaUseCase {
  constructor(
    private readonly actaRepo: IActaRepository,
    private readonly offlineQueueRepo: IOfflineActaQueueRepository,
    private readonly networkStatus: INetworkStatusService,
  ) {}

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

    const online = await this.networkStatus.isOnline();
    if (!online) {
      return this.offlineQueueRepo.enqueue(input);
    }

    try {
      const saved = await this.actaRepo.saveActa(input);
      await this.offlineQueueRepo.remove(input.jrvId, input.dignidad);
      return saved;
    } catch (error) {
      if (error instanceof NetworkError) {
        return this.offlineQueueRepo.enqueue(input, error.message);
      }
      throw error;
    }
  }
}
