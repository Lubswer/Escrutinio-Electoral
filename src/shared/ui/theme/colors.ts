/**
 * Paleta institucional de la organización política y estados semánticos (RNF-03, RF-13).
 * Alto contraste pensado para legibilidad en exteriores y personas mayores.
 */
export const Colors = {
  primary: '#1E3A8A',       // Azul institucional fuerte
  primaryLight: '#DBEAFE',
  accent: '#F59E0B',        // Dorado / Ámbar electoral
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  border: '#CBD5E1',

  // Estados de envío y validaciones (RF-13)
  success: '#15803D',
  successBg: '#DCFCE7',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
} as const;
