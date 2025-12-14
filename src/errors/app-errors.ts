/**
 * Clases de error personalizadas para el sistema Spikes CRM
 * Proporciona errores tipados con códigos HTTP y mensajes descriptivos
 */

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  [key: string]: unknown;
}

/**
 * Error base de la aplicación
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: ErrorDetails
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error de validación - 400 Bad Request
 * Usado cuando los datos de entrada no cumplen las reglas de validación
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, 400, "VALIDATION_ERROR", details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de campo requerido - 400 Bad Request
 * Usado cuando un campo obligatorio no está presente
 */
export class RequiredFieldError extends ValidationError {
  constructor(fieldName: string, fieldLabel?: string) {
    const label = fieldLabel || fieldName;
    super(`El campo "${label}" es obligatorio.`, {
      field: fieldName,
      constraint: "required",
    });
    Object.setPrototypeOf(this, RequiredFieldError.prototype);
  }
}

/**
 * Error de formato inválido - 400 Bad Request
 * Usado cuando un campo tiene formato incorrecto
 */
export class InvalidFormatError extends ValidationError {
  constructor(fieldName: string, expectedFormat: string, fieldLabel?: string) {
    const label = fieldLabel || fieldName;
    super(`El campo "${label}" tiene un formato inválido. Formato esperado: ${expectedFormat}.`, {
      field: fieldName,
      constraint: "format",
      expectedFormat,
    });
    Object.setPrototypeOf(this, InvalidFormatError.prototype);
  }
}

/**
 * Error de valor fuera de rango - 400 Bad Request
 * Usado cuando un valor numérico está fuera del rango permitido
 */
export class OutOfRangeError extends ValidationError {
  constructor(fieldName: string, min?: number, max?: number, fieldLabel?: string) {
    const label = fieldLabel || fieldName;
    let message = `El campo "${label}" está fuera del rango permitido.`;
    if (min !== undefined && max !== undefined) {
      message = `El campo "${label}" debe estar entre ${min} y ${max}.`;
    } else if (min !== undefined) {
      message = `El campo "${label}" debe ser mayor o igual a ${min}.`;
    } else if (max !== undefined) {
      message = `El campo "${label}" debe ser menor o igual a ${max}.`;
    }

    super(message, {
      field: fieldName,
      constraint: "range",
      min,
      max,
    });
    Object.setPrototypeOf(this, OutOfRangeError.prototype);
  }
}

/**
 * Error de longitud inválida - 400 Bad Request
 * Usado cuando un campo de texto no cumple con la longitud requerida
 */
export class InvalidLengthError extends ValidationError {
  constructor(fieldName: string, minLength?: number, maxLength?: number, fieldLabel?: string) {
    const label = fieldLabel || fieldName;
    let message = `El campo "${label}" tiene una longitud inválida.`;
    if (minLength !== undefined && maxLength !== undefined) {
      message = `El campo "${label}" debe tener entre ${minLength} y ${maxLength} caracteres.`;
    } else if (minLength !== undefined) {
      message = `El campo "${label}" debe tener al menos ${minLength} caracteres.`;
    } else if (maxLength !== undefined) {
      message = `El campo "${label}" no puede exceder ${maxLength} caracteres.`;
    }

    super(message, {
      field: fieldName,
      constraint: "length",
      minLength,
      maxLength,
    });
    Object.setPrototypeOf(this, InvalidLengthError.prototype);
  }
}

/**
 * Error de recurso no encontrado - 404 Not Found
 * Usado cuando no se encuentra un recurso solicitado
 */
export class NotFoundError extends AppError {
  constructor(resourceName: string, identifier?: string | number) {
    const message = identifier
      ? `${resourceName} con identificador "${identifier}" no encontrado.`
      : `${resourceName} no encontrado.`;

    super(message, 404, "NOT_FOUND", {
      resource: resourceName,
      identifier,
    });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de entidad duplicada - 409 Conflict
 * Usado cuando se intenta crear un recurso que ya existe
 */
export class DuplicateError extends AppError {
  constructor(resourceName: string, fieldName?: string, value?: unknown) {
    const message = fieldName
      ? `Ya existe un ${resourceName} con el mismo ${fieldName}.`
      : `Este ${resourceName} ya existe.`;

    super(message, 409, "DUPLICATE_ENTRY", {
      resource: resourceName,
      field: fieldName,
      value,
    });
    Object.setPrototypeOf(this, DuplicateError.prototype);
  }
}

/**
 * Error de permisos - 403 Forbidden
 * Usado cuando el usuario no tiene permisos para realizar una acción
 */
export class ForbiddenError extends AppError {
  constructor(action?: string, reason?: string) {
    const message = action
      ? `No tienes permisos para ${action}.`
      : "No tienes permisos para realizar esta acción.";

    super(message, 403, "FORBIDDEN", {
      action,
      reason,
    });
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error de autenticación - 401 Unauthorized
 * Usado cuando la autenticación falla o no está presente
 */
export class UnauthorizedError extends AppError {
  constructor(reason?: string) {
    const message = reason || "No autorizado. Por favor, inicia sesión.";

    super(message, 401, "UNAUTHORIZED", {
      reason,
    });
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error de relación no encontrada - 400 Bad Request
 * Usado cuando una entidad relacionada no existe
 */
export class RelationNotFoundError extends ValidationError {
  constructor(relationName: string, relationId: string | number, parentEntity?: string) {
    const message = parentEntity
      ? `No se puede crear/actualizar ${parentEntity}: ${relationName} con ID "${relationId}" no existe.`
      : `${relationName} con ID "${relationId}" no existe.`;

    super(message, {
      relation: relationName,
      relationId,
      parentEntity,
    });
    Object.setPrototypeOf(this, RelationNotFoundError.prototype);
  }
}

/**
 * Error de regla de negocio - 422 Unprocessable Entity
 * Usado cuando se viola una regla de negocio
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, ruleName?: string, details?: ErrorDetails) {
    super(message, 422, "BUSINESS_RULE_VIOLATION", {
      rule: ruleName,
      ...details,
    });
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

/**
 * Error de configuración faltante - 500 Internal Server Error
 * Usado cuando falta una configuración necesaria para una operación
 */
export class ConfigurationError extends AppError {
  constructor(configName: string, details?: string) {
    const message = details
      ? `Configuración faltante: ${configName}. ${details}`
      : `Configuración faltante: ${configName}.`;

    super(message, 500, "CONFIGURATION_ERROR", {
      config: configName,
    });
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error de cálculo - 422 Unprocessable Entity
 * Usado cuando no se puede realizar un cálculo
 */
export class CalculationError extends AppError {
  constructor(message: string, calculationType?: string, details?: ErrorDetails) {
    super(message, 422, "CALCULATION_ERROR", {
      calculationType,
      ...details,
    });
    Object.setPrototypeOf(this, CalculationError.prototype);
  }
}

/**
 * Error de estado inválido - 422 Unprocessable Entity
 * Usado cuando una entidad está en un estado que no permite la operación
 */
export class InvalidStateError extends AppError {
  constructor(
    entityName: string,
    currentState: string,
    requiredState?: string,
    action?: string
  ) {
    let message = `${entityName} está en estado "${currentState}"`;
    if (action) {
      message += ` y no se puede ${action}`;
    }
    if (requiredState) {
      message += `. Estado requerido: "${requiredState}"`;
    }
    message += ".";

    super(message, 422, "INVALID_STATE", {
      entity: entityName,
      currentState,
      requiredState,
      action,
    });
    Object.setPrototypeOf(this, InvalidStateError.prototype);
  }
}
