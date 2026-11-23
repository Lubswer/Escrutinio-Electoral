export interface PhotoCaptureResult {
  uri: string;
  sharpnessScore: number;
  isBlurry: boolean;
}

export interface GpsEvidenceResult {
  latitude: number;
  longitude: number;
  timestamp: string;
  isVerified: boolean;
}

/**
 * Puerto de dominio para captura de fotografía, validación de nitidez (ADR-06)
 * y obtención de coordenadas GPS satelitales (ADR-04 / S-07 / S-10).
 */
export interface IMediaEvidenceService {
  captureAndValidatePhoto(): Promise<PhotoCaptureResult | null>;
  evaluatePhotoSharpness(uri: string): Promise<{ sharpnessScore: number; isBlurry: boolean }>;
  captureGpsLocation(): Promise<GpsEvidenceResult>;
}
