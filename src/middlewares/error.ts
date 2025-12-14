import { AppError } from "../errors/app-errors";

/**
 * Interfaz para la respuesta de error estructurada
 */
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
  };
}

/**
 * Mapa de mensajes de error legacy a mensajes descriptivos en español
 * Para mantener compatibilidad con errores existentes
 */
const legacyErrorMap: Record<string, { message: string; statusCode: number }> = {
  // Errores de autenticación
  "invalid-token": {
    message: "Token de autenticación inválido o expirado.",
    statusCode: 401,
  },
  "No token provided": {
    message: "No se proporcionó token de autenticación.",
    statusCode: 401,
  },
  "invalid-email-or-password": {
    message: "Usuario o contraseña incorrectos.",
    statusCode: 401,
  },

  // Errores de permisos
  "not-permission": {
    message: "No tienes permisos para realizar esta acción.",
    statusCode: 403,
  },
  "Not permission": {
    message: "No tienes permisos para realizar esta acción.",
    statusCode: 403,
  },

  // Errores de entidades no encontradas
  "contract-not-found": {
    message: "Contrato no encontrado.",
    statusCode: 404,
  },
  "user-not-found": {
    message: "Usuario no encontrado.",
    statusCode: 404,
  },
  "lead-not-found": {
    message: "Lead no encontrado.",
    statusCode: 404,
  },
  "task-not-found": {
    message: "Tarea no encontrada.",
    statusCode: 404,
  },
  "liquidation-not-found": {
    message: "Liquidación no encontrada.",
    statusCode: 404,
  },
  "channel-not-found": {
    message: "Canal no encontrado.",
    statusCode: 404,
  },
  "company-not-found": {
    message: "Compañía no encontrada.",
    statusCode: 404,
  },
  "campaign-not-found": {
    message: "Campaña no encontrada.",
    statusCode: 404,
  },
  "Customer not found": {
    message: "Cliente no encontrado.",
    statusCode: 404,
  },
  "Task not found": {
    message: "Tarea no encontrada.",
    statusCode: 404,
  },
  "Liquidation not found": {
    message: "Liquidación no encontrada.",
    statusCode: 404,
  },
  "Manager not found": {
    message: "Manager no encontrado.",
    statusCode: 404,
  },
  "Document not found": {
    message: "Documento no encontrado.",
    statusCode: 404,
  },
  "lead not found": {
    message: "Lead no encontrado.",
    statusCode: 404,
  },

  // Errores de leads
  "No available lead to assign": {
    message: "No hay leads disponibles para asignar.",
    statusCode: 404,
  },
  "User does not belong to any group": {
    message: "El usuario no pertenece a ningún grupo.",
    statusCode: 400,
  },
  "No campaigns available for the user's groups": {
    message: "No hay campañas disponibles para los grupos del usuario.",
    statusCode: 400,
  },
  "User to assign not specified": {
    message: "Debe especificar el usuario al que asignar el lead.",
    statusCode: 400,
  },
  "Personal Agenda Data not specified": {
    message: "Debe especificar los datos de la agenda personal (asunto y fecha).",
    statusCode: 400,
  },

  // Errores de liquidación
  "Duplicate liquidation name": {
    message: "Ya existe una liquidación con este nombre.",
    statusCode: 409,
  },

  // Errores de formato
  "Invalid user data format.": {
    message: "El formato de los datos del usuario es inválido.",
    statusCode: 400,
  },

  // Errores de contratos
  "Contrato sin tarifa asignada.": {
    message: "Contrato sin tarifa asignada. No se puede calcular fecha de renovación.",
    statusCode: 422,
  },
  "Contrato de telefonía sin tarifas asociadas.": {
    message: "Contrato de telefonía sin tarifas asociadas. No se puede calcular fecha de renovación.",
    statusCode: 422,
  },

  // Errores de comisiones
  "minConsumo debe ser menor o igual a maxConsumo": {
    message: "El consumo mínimo debe ser menor o igual al consumo máximo.",
    statusCode: 400,
  },
  "El tramo se solapa con uno existente": {
    message: "El tramo de comisión se solapa con uno existente.",
    statusCode: 409,
  },
};

/**
 * Detecta errores de base de datos y devuelve mensajes descriptivos
 */
const handleDatabaseError = (err: any): { message: string; statusCode: number } | null => {
  // Error de duplicado MySQL
  if (err.code === "ER_DUP_ENTRY") {
    // Intentar extraer el campo del mensaje
    const match = err.message?.match(/Duplicate entry '.*' for key '(.+)'/);
    const keyName = match ? match[1] : "registro";
    return {
      message: `Ya existe un registro con el mismo valor. Campo duplicado: ${keyName}.`,
      statusCode: 409,
    };
  }

  // Error de clave foránea
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
    return {
      message: "No se puede completar la operación: una de las referencias no existe.",
      statusCode: 400,
    };
  }

  // Error de restricción de clave foránea al eliminar
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
    return {
      message: "No se puede eliminar: existen registros relacionados que dependen de este elemento.",
      statusCode: 409,
    };
  }

  return null;
};

/**
 * Middleware de manejo de errores centralizado
 * Convierte todos los errores a un formato estructurado y descriptivo
 */
const errorHandler = (err: any, req: any, res: any, next: any) => {
  // Log del error para debugging (solo en desarrollo o con nivel de log apropiado)
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
  } else {
    console.error("Error:", err.message);
  }

  let statusCode: number;
  let errorCode: string;
  let message: string;
  let details: Record<string, unknown> | undefined;

  // 1. Si es un AppError personalizado, usar sus propiedades
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // 2. Verificar si es un error de base de datos
  else if (err.code && handleDatabaseError(err)) {
    const dbError = handleDatabaseError(err)!;
    statusCode = dbError.statusCode;
    errorCode = "DATABASE_ERROR";
    message = dbError.message;
  }
  // 3. Verificar si el mensaje coincide con un error legacy conocido
  else if (legacyErrorMap[err.message]) {
    const legacyError = legacyErrorMap[err.message];
    statusCode = legacyError.statusCode;
    errorCode = "LEGACY_ERROR";
    message = legacyError.message;
  }
  // 4. Verificar si el error tiene statusCode ya asignado
  else if (err.statusCode) {
    statusCode = err.statusCode;
    errorCode = err.code || "ERROR";
    message = err.message;
  }
  // 5. Verificar statusCode en la respuesta
  else if (res.statusCode && res.statusCode !== 200) {
    statusCode = res.statusCode;
    errorCode = "ERROR";
    message = err.message;
  }
  // 6. Error genérico - 500
  else {
    statusCode = 500;
    errorCode = "INTERNAL_ERROR";
    // En producción, no exponer detalles del error interno
    message =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Error interno del servidor. Por favor, intenta de nuevo más tarde.";
  }

  // Construir respuesta estructurada
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      statusCode,
    },
  };

  // Incluir detalles solo si existen y estamos en desarrollo o es un error operacional
  if (details && (process.env.NODE_ENV === "development" || err.isOperational)) {
    errorResponse.error.details = details;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
