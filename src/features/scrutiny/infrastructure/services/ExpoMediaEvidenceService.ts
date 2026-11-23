import { PermissionError } from '@shared/domain/errors/AppError';
import * as ImagePicker from 'expo-image-picker';
import {
  GpsEvidenceResult,
  IMediaEvidenceService,
  PhotoCaptureResult,
} from '../../domain/services/IMediaEvidenceService';
import { captureSatellitalGps } from './GpsLocationService';
import { analyzeImageBlur } from './ImageBlurDetectorService';

export class ExpoMediaEvidenceService implements IMediaEvidenceService {
  async captureAndValidatePhoto(): Promise<PhotoCaptureResult | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new PermissionError(
        'Se requiere acceso a la cámara para fotografiar el acta de escrutinio.',
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    const asset = result.assets[0];
    const blur = await analyzeImageBlur(asset.uri, asset.width);

    return {
      uri: asset.uri,
      sharpnessScore: blur.sharpnessScore,
      isBlurry: blur.isBlurry,
    };
  }

  async evaluatePhotoSharpness(
    uri: string,
  ): Promise<{ sharpnessScore: number; isBlurry: boolean }> {
    return analyzeImageBlur(uri);
  }

  async captureGpsLocation(): Promise<GpsEvidenceResult> {
    return captureSatellitalGps();
  }
}
