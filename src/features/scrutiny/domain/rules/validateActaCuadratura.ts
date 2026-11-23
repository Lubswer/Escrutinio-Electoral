import { ValidationError } from '@shared/domain/errors/AppError';
import { VotoCandidato } from '../entities/Acta';

export interface CuadraturaValidationInput {
  totalSufragantes: number;
  votosBlancos: number;
  votosNulos: number;
  votosPorCandidato: VotoCandidato[];
}

export interface CuadraturaSummary {
  valid: boolean;
  sumaCandidatos: number;
  sumaTotal: number;
  diferencia: number;
  errorMessage?: string;
}

/**
 * Regla de negocio pura (RF-10):
 * - Ningún candidato ni rubro puede superar el total de sufragantes.
 * - La suma de votos por candidato + blancos + nulos debe coincidir exactamente con totalSufragantes.
 */
export function evaluateActaCuadratura(input: CuadraturaValidationInput): CuadraturaSummary {
  const { totalSufragantes, votosBlancos, votosNulos, votosPorCandidato } = input;

  if (totalSufragantes < 0 || votosBlancos < 0 || votosNulos < 0) {
    return {
      valid: false,
      sumaCandidatos: 0,
      sumaTotal: 0,
      diferencia: 0,
      errorMessage: 'Los valores de votos no pueden ser negativos.',
    };
  }

  for (const item of votosPorCandidato) {
    if (item.votos < 0) {
      return {
        valid: false,
        sumaCandidatos: 0,
        sumaTotal: 0,
        diferencia: 0,
        errorMessage: 'Los votos de un candidato no pueden ser negativos.',
      };
    }
    if (item.votos > totalSufragantes) {
      return {
        valid: false,
        sumaCandidatos: 0,
        sumaTotal: 0,
        diferencia: 0,
        errorMessage: 'Ninguna organización política puede superar el total de sufragantes.',
      };
    }
  }

  const sumaCandidatos = votosPorCandidato.reduce((acc, item) => acc + item.votos, 0);
  const sumaTotal = sumaCandidatos + votosBlancos + votosNulos;
  const diferencia = totalSufragantes - sumaTotal;

  if (sumaTotal !== totalSufragantes) {
    return {
      valid: false,
      sumaCandidatos,
      sumaTotal,
      diferencia,
      errorMessage: `La suma (${sumaTotal}) no coincide con el total de sufragantes (${totalSufragantes}). Diferencia: ${diferencia}.`,
    };
  }

  return {
    valid: true,
    sumaCandidatos,
    sumaTotal,
    diferencia: 0,
  };
}

export function assertActaCuadratura(input: CuadraturaValidationInput): void {
  const result = evaluateActaCuadratura(input);
  if (!result.valid) {
    throw new ValidationError(result.errorMessage ?? 'Error de cuadratura en el acta.');
  }
}
