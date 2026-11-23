import { Buffer } from 'buffer';
import { File } from 'expo-file-system';
import { ImageManipulator, ImageRef, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { Platform } from 'react-native';

export const DEFAULT_ANALYSIS_WIDTH = 600;
// Supuesto S-12: Umbral empírico interno no editable por el usuario final
export const DEFAULT_BLUR_THRESHOLD = 600;

export interface BlurAnalysisResult {
  sharpnessScore: number;
  isBlurry: boolean;
}

/**
 * Calcula la varianza del operador Laplaciano (4 vecinos) sobre luminancia perceptual.
 */
export function calculateLaplacianVariance(
  rgba: Uint8Array,
  width: number,
  height: number,
): number {
  if (width < 3 || height < 3) return 0;

  const totalPixels = width * height;
  const gray = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    gray[i] = 0.299 * rgba[offset] + 0.587 * rgba[offset + 1] + 0.114 * rgba[offset + 2];
  }

  const interiorCount = (width - 2) * (height - 2);
  const laplacians = new Float32Array(interiorCount);
  let sum = 0;
  let idx = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = y * width + x;
      const value =
        gray[center - width] +
        gray[center + width] +
        gray[center - 1] +
        gray[center + 1] -
        4 * gray[center];
      laplacians[idx++] = value;
      sum += value;
    }
  }

  const mean = sum / interiorCount;
  let varianceSum = 0;
  for (let i = 0; i < interiorCount; i++) {
    const diff = laplacians[i] - mean;
    varianceSum += diff * diff;
  }

  return varianceSum / interiorCount;
}

/**
 * ADR-06: Evalúa nitidez de una imagen localmente en JS sin OpenCV.
 */
export async function analyzeImageBlur(
  imageUri: string,
  originalWidth?: number,
  threshold: number = DEFAULT_BLUR_THRESHOLD,
): Promise<BlurAnalysisResult> {
  let imageRef: ImageRef | null = null;
  let tempFile: File | null = null;

  try {
    const targetWidth =
      originalWidth && originalWidth < DEFAULT_ANALYSIS_WIDTH
        ? originalWidth
        : DEFAULT_ANALYSIS_WIDTH;

    const context = ImageManipulator.manipulate(imageUri);
    context.resize({ width: targetWidth });
    imageRef = await context.renderAsync();

    const manipulated = await imageRef.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.95,
    });

    let bytes: Uint8Array;
    if (Platform.OS === 'web') {
      const response = await fetch(manipulated.uri);
      const arrayBuffer = await response.arrayBuffer();
      bytes = new Uint8Array(arrayBuffer);
    } else {
      tempFile = new File(manipulated.uri);
      bytes = await tempFile.bytes();
    }

    const jpegBuffer = Buffer.from(bytes);
    const rawImageData = jpeg.decode(jpegBuffer, { useTArray: true });
    const score = calculateLaplacianVariance(
      rawImageData.data,
      rawImageData.width,
      rawImageData.height,
    );
    const roundedScore = Math.round(score * 100) / 100;

    return {
      sharpnessScore: roundedScore,
      isBlurry: roundedScore < threshold,
    };
  } finally {
    if (imageRef) {
      imageRef.release();
    }
    if (tempFile) {
      try {
        tempFile.delete();
      } catch {
        // Ignorar si el archivo temporal ya fue limpiado por el sistema
      }
    }
  }
}
