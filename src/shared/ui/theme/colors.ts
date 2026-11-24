/**
 * Paleta oficial de la organización política: Acción Democrática Nacional (ADN - Lista 7)
 * + colores semánticos de alto contraste para legibilidad en exteriores (RNF-03, RF-13).
 */
export const Colors = {
  // Colores oficiales ADN 7
  primary: '#45135B',        // Morado Principal
  primaryDark: '#1C0624',    // Morado Oscuro
  primaryMedium: '#8D2F90',  // Morado Medio
  primaryWarm: '#B63C9E',    // Púrpura Cálido
  primaryLight: '#f3e8f7ff',   // Lila suave para fondos y chips
  accent: '#f1ee28ff',         // Amarillo ADN 7

  // Superficies y tipografía
  background: '#f7f4faff',
  surface: '#f8f7f7ff',
  text: '#1C0624',
  textSecondary: '#5B4B66',
  border: '#DCCEE5',

  // Estados de envío y validaciones (RF-13)
  success: '#15803D',
  successBg: '#DCFCE7',
  warning: '#B45309',
  warningBg: '#FEF3C7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
} as const;
