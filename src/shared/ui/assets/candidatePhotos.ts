import { ImageSource } from 'expo-image';

const ALCALDE_PHOTOS: Record<string, ImageSource> = {
  carlos: require('@/assets/Alcaldes/CarlosArmijosAlcalde.jpeg'),
  fabian: require('@/assets/Alcaldes/FabianIzaAlcalde.jpeg'),
  mariana: require('@/assets/Alcaldes/MarianaMaldonadoAlcalde.jpeg'),
  paola: require('@/assets/Alcaldes/PaolaHualpaAlcalde.jpeg'),
  santiago: require('@/assets/Alcaldes/SantiagoSalazarAlcalde.jpeg'),
};

const PREFECTO_PHOTOS: Record<string, ImageSource> = {
  alonso: require('@/assets/Prefectos/AlonsoMorenoPrefectojpeg.jpeg'),
  giovanna: require('@/assets/Prefectos/GiovannaUbidiaPrefecto.jpeg'),
  guillermo: require('@/assets/Prefectos/GuillermoChuruchumbiPrefecto.jpeg'),
  juan: require('@/assets/Prefectos/JuanZapataPrefecto.jpeg'),
  mishelle: require('@/assets/Prefectos/MishelleCalvachePrefecto.jpeg'),
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getCandidatePhoto(
  dignidad: 'alcalde' | 'prefecto',
  candidatoNombre: string,
): ImageSource | null {
  const normalized = normalizeText(candidatoNombre);
  const catalog = dignidad === 'alcalde' ? ALCALDE_PHOTOS : PREFECTO_PHOTOS;

  for (const [key, source] of Object.entries(catalog)) {
    if (normalized.includes(key)) {
      return source;
    }
  }

  return null;
}
