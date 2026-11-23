export type AppErrorCode =
  | 'AUTH_ERROR'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFLICT_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly cause?: unknown;

  constructor(message: string, code: AppErrorCode = 'UNKNOWN_ERROR', cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.cause = cause;
  }
}

export class AuthError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'AUTH_ERROR', cause);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause);
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Sin conexión a internet. La operación quedó en cola.', cause?: unknown) {
    super(message, 'NETWORK_ERROR', cause);
  }
}

/**
 * Error para control de concurrencia optimista (Supuesto S-05):
 * Se lanza cuando un veedor y coordinador editan una misma acta con versión desactualizada.
 */
export class ConflictError extends AppError {
  constructor(
    message = 'El acta fue modificada por otro usuario. Recarga los datos antes de guardar.',
    cause?: unknown,
  ) {
    super(message, 'CONFLICT_ERROR', cause);
  }
}

export class PermissionError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.', cause?: unknown) {
    super(message, 'PERMISSION_ERROR', cause);
  }
}
