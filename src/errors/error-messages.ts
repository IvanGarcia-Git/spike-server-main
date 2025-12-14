/**
 * Mensajes de error centralizados en español para el sistema Spikes CRM
 * Organizado por dominio/entidad para facilitar mantenimiento
 */

export const ErrorMessages = {
  // ============================================
  // ERRORES GENÉRICOS
  // ============================================
  Generic: {
    REQUIRED_FIELD: (field: string) => `El campo "${field}" es obligatorio.`,
    INVALID_FORMAT: (field: string, format: string) =>
      `El campo "${field}" tiene un formato inválido. Formato esperado: ${format}.`,
    NOT_FOUND: (entity: string) => `${entity} no encontrado.`,
    NOT_FOUND_WITH_ID: (entity: string, id: string | number) =>
      `${entity} con identificador "${id}" no encontrado.`,
    DUPLICATE: (entity: string, field?: string) =>
      field ? `Ya existe un ${entity} con el mismo ${field}.` : `Este ${entity} ya existe.`,
    NO_PERMISSION: "No tienes permisos para realizar esta acción.",
    INTERNAL_ERROR: "Error interno del servidor. Por favor, intenta de nuevo más tarde.",
    INVALID_DATA: "Los datos proporcionados son inválidos.",
  },

  // ============================================
  // ERRORES DE AUTENTICACIÓN
  // ============================================
  Auth: {
    INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
    USER_NOT_FOUND: "Usuario no encontrado.",
    INVALID_TOKEN: "Token de autenticación inválido o expirado.",
    NO_TOKEN: "No se proporcionó token de autenticación.",
    PASSWORDS_DO_NOT_MATCH: "Las contraseñas no coinciden.",
    PASSWORD_REQUIRED: "La contraseña es obligatoria.",
    WEAK_PASSWORD:
      "La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas y números.",
  },

  // ============================================
  // ERRORES DE CONTRATOS
  // ============================================
  Contract: {
    NOT_FOUND: "Contrato no encontrado.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Contrato con UUID "${uuid}" no encontrado.`,
    CUPS_REQUIRED: "El CUPS es obligatorio para contratos de Luz o Gas.",
    CUPS_INVALID_FORMAT:
      "El CUPS tiene un formato inválido. Debe tener 20-22 caracteres alfanuméricos.",
    CUSTOMER_REQUIRED: "El cliente es obligatorio para crear un contrato.",
    CUSTOMER_NOT_FOUND: (customerId: number) =>
      `No se puede crear el contrato: Cliente con ID "${customerId}" no existe.`,
    RATE_REQUIRED: "La tarifa es obligatoria.",
    RATE_NOT_FOUND: (rateId: number) =>
      `No se puede crear el contrato: Tarifa con ID "${rateId}" no existe.`,
    USER_REQUIRED: "El usuario asignado es obligatorio.",
    USER_NOT_FOUND: (userId: number) =>
      `No se puede crear el contrato: Usuario con ID "${userId}" no existe.`,
    COMPANY_NOT_FOUND: (companyId: number) =>
      `No se puede crear el contrato: Compañía con ID "${companyId}" no existe.`,
    CHANNEL_NOT_FOUND: (channelId: number) =>
      `No se puede crear el contrato: Canal con ID "${channelId}" no existe.`,
    TYPE_REQUIRED: "El tipo de contrato (Luz, Gas, Telefonía) es obligatorio.",
    TYPE_INVALID: "El tipo de contrato debe ser: Luz, Gas o Telefonía.",
    CANNOT_UPDATE_NON_DRAFT:
      "Solo los administradores pueden modificar contratos que no están en borrador.",
    CANNOT_DELETE_NON_DRAFT:
      "Solo los administradores pueden eliminar contratos que no están en borrador.",
    NO_RATE_FOR_RENEW: "Contrato sin tarifa asignada. No se puede calcular fecha de renovación.",
    NO_TELEPHONY_RATES:
      "Contrato de telefonía sin tarifas asociadas. No se puede calcular fecha de renovación.",
    TELEPHONY_DATA_REQUIRED: "Los datos de telefonía son obligatorios para contratos de Telefonía.",
  },

  // ============================================
  // ERRORES DE CLIENTES
  // ============================================
  Customer: {
    NOT_FOUND: "Cliente no encontrado.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Cliente con UUID "${uuid}" no encontrado.`,
    NAME_REQUIRED: "El nombre del cliente es obligatorio.",
    SURNAMES_REQUIRED: "Los apellidos del cliente son obligatorios.",
    NATIONAL_ID_REQUIRED: "El DNI/NIE/NIF es obligatorio.",
    NATIONAL_ID_INVALID: "El DNI/NIE/NIF tiene un formato inválido.",
    EMAIL_REQUIRED: "El email es obligatorio.",
    EMAIL_INVALID: "El email tiene un formato inválido.",
    PHONE_REQUIRED: "El teléfono es obligatorio.",
    PHONE_INVALID: "El teléfono tiene un formato inválido. Debe tener 9 dígitos.",
    IBAN_REQUIRED: "El IBAN es obligatorio.",
    IBAN_INVALID: "El IBAN tiene un formato inválido o no es válido.",
    ADDRESS_REQUIRED: "La dirección es obligatoria.",
    ZIPCODE_REQUIRED: "El código postal es obligatorio.",
    ZIPCODE_INVALID: "El código postal debe tener 5 dígitos.",
    PROVINCE_REQUIRED: "La provincia es obligatoria.",
    POPULACE_REQUIRED: "La población es obligatoria.",
    DUPLICATE_EMAIL: "Ya existe un cliente con este email.",
    DUPLICATE_PHONE: "Ya existe un cliente con este teléfono.",
    DUPLICATE_NATIONAL_ID: "Ya existe un cliente con este DNI/NIE/NIF.",
  },

  // ============================================
  // ERRORES DE LEADS
  // ============================================
  Lead: {
    NOT_FOUND: "Lead no encontrado.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Lead con UUID "${uuid}" no encontrado.`,
    PHONE_REQUIRED: "El número de teléfono es obligatorio.",
    PHONE_INVALID: "El número de teléfono tiene un formato inválido.",
    CAMPAIGN_REQUIRED: "La campaña es obligatoria.",
    CAMPAIGN_NOT_FOUND: "Campaña no encontrada.",
    FULL_NAME_REQUIRED: "El nombre completo es obligatorio.",
    NO_AVAILABLE_LEAD: "No hay leads disponibles para asignar.",
    USER_NOT_IN_GROUP: "El usuario no pertenece a ningún grupo.",
    NO_CAMPAIGNS_FOR_GROUP: "No hay campañas disponibles para los grupos del usuario.",
    USER_TO_ASSIGN_REQUIRED: "Debe especificar el usuario al que asignar el lead.",
    PERSONAL_AGENDA_DATA_REQUIRED:
      "Debe especificar los datos de la agenda personal (asunto y fecha).",
    STATE_NOT_HANDLED: (stateId: number) =>
      `El estado de lead "${stateId}" no está configurado para esta acción.`,
    DUPLICATE_PHONE: "Ya existe un lead con este número de teléfono.",
  },

  // ============================================
  // ERRORES DE LIQUIDACIONES
  // ============================================
  Liquidation: {
    NOT_FOUND: "Liquidación no encontrada.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Liquidación con UUID "${uuid}" no encontrada.`,
    NAME_REQUIRED: "El nombre de la liquidación es obligatorio.",
    NAME_EMPTY: "El nombre de la liquidación no puede estar vacío.",
    DATE_REQUIRED: "La fecha es obligatoria.",
    DATE_INVALID_FORMAT: "La fecha debe tener formato YYYY-MM-DD.",
    TYPE_REQUIRED: "El tipo de liquidación es obligatorio.",
    TYPE_INVALID: "El tipo de liquidación debe ser: INGRESO o GASTO.",
    USER_NOT_FOUND: (userId: number) =>
      `No se puede crear la liquidación: Usuario con ID "${userId}" no existe.`,
    DUPLICATE_NAME: "Ya existe una liquidación con este nombre.",
    AMOUNT_INVALID: "El monto debe ser un número positivo.",
    STATUS_INVALID: "El estado de liquidación no es válido.",
    CANNOT_CALCULATE_COMMISSION:
      "No se puede calcular la comisión: faltan datos necesarios (consumo, tarifa o canal).",
    NO_COMMISSION_TIER:
      "No se encontró un tramo de comisión aplicable para el consumo indicado.",
    NO_COMMISSION_ASSIGNMENT:
      "No se encontró asignación de comisión para la combinación de canal, tarifa y usuario.",
  },

  // ============================================
  // ERRORES DE TAREAS
  // ============================================
  Task: {
    NOT_FOUND: "Tarea no encontrada.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Tarea con UUID "${uuid}" no encontrada.`,
    SUBJECT_REQUIRED: "El asunto de la tarea es obligatorio.",
    SUBJECT_TOO_SHORT: "El asunto de la tarea debe tener al menos 3 caracteres.",
    ASSIGNEE_REQUIRED: "El usuario asignado es obligatorio.",
    ASSIGNEE_NOT_FOUND: (userId: number) =>
      `No se puede crear la tarea: Usuario asignado con ID "${userId}" no existe.`,
    CREATOR_NOT_FOUND: (userId: number) =>
      `No se puede crear la tarea: Usuario creador con ID "${userId}" no existe.`,
    START_DATE_INVALID: "La fecha de inicio tiene un formato inválido.",
    START_DATE_PAST: "La fecha de inicio no puede ser en el pasado.",
    STATE_NOT_FOUND: (stateId: number) =>
      `Estado de tarea con ID "${stateId}" no existe.`,
  },

  // ============================================
  // ERRORES DE USUARIOS
  // ============================================
  User: {
    NOT_FOUND: "Usuario no encontrado.",
    NOT_FOUND_WITH_UUID: (uuid: string) => `Usuario con UUID "${uuid}" no encontrado.`,
    NOT_FOUND_WITH_ID: (userId: number) => `Usuario con ID "${userId}" no encontrado.`,
    NAME_REQUIRED: "El nombre es obligatorio.",
    FIRST_SURNAME_REQUIRED: "El primer apellido es obligatorio.",
    USERNAME_REQUIRED: "El nombre de usuario es obligatorio.",
    USERNAME_TOO_SHORT: "El nombre de usuario debe tener al menos 4 caracteres.",
    USERNAME_INVALID: "El nombre de usuario solo puede contener letras, números y guiones bajos.",
    USERNAME_DUPLICATE: "Este nombre de usuario ya está en uso.",
    EMAIL_REQUIRED: "El email es obligatorio.",
    EMAIL_INVALID: "El email tiene un formato inválido.",
    EMAIL_DUPLICATE: "Este email ya está registrado.",
    PASSWORD_REQUIRED: "La contraseña es obligatoria.",
    PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
    ROLE_REQUIRED: "El rol es obligatorio.",
    ROLE_INVALID: "El rol debe ser: Admin, Agente o Colaborador.",
    IBAN_INVALID: "El IBAN tiene un formato inválido.",
    PHONE_INVALID: "El teléfono tiene un formato inválido.",
    ONLY_MANAGERS_CAN_CREATE: "Solo los managers pueden crear usuarios.",
    ONLY_MANAGERS_CAN_UPDATE: "Solo los managers pueden modificar usuarios.",
    ONLY_MANAGERS_CAN_DELETE: "Solo los managers pueden eliminar usuarios.",
    CANNOT_DELETE_SELF: "No puedes eliminar tu propia cuenta.",
    MANAGER_NOT_FOUND: "Manager no encontrado.",
  },

  // ============================================
  // ERRORES DE COMISIONES
  // ============================================
  Commission: {
    TIER_OVERLAP: "El tramo de comisión se solapa con uno existente.",
    MIN_GREATER_THAN_MAX:
      "El consumo mínimo debe ser menor o igual al consumo máximo.",
    RATE_NOT_FOUND: (rateId: number) =>
      `Tarifa con ID "${rateId}" no encontrada para calcular comisión.`,
    NO_APPLICABLE_TIER: "No se encontró un tramo de comisión aplicable para el consumo indicado.",
    INVALID_CONSUMPTION: "El consumo debe ser un número positivo.",
  },

  // ============================================
  // ERRORES DE ARCHIVOS
  // ============================================
  File: {
    NOT_FOUND: "Archivo no encontrado.",
    UPLOAD_FAILED: "Error al subir el archivo. Por favor, intenta de nuevo.",
    INVALID_TYPE: (allowedTypes: string[]) =>
      `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(", ")}.`,
    TOO_LARGE: (maxSizeMB: number) =>
      `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB.`,
    DELETE_FAILED: "Error al eliminar el archivo.",
  },

  // ============================================
  // ERRORES DE CAMPAÑAS
  // ============================================
  Campaign: {
    NOT_FOUND: "Campaña no encontrada.",
    NAME_REQUIRED: "El nombre de la campaña es obligatorio.",
    DUPLICATE_NAME: "Ya existe una campaña con este nombre.",
  },

  // ============================================
  // ERRORES DE CANALES
  // ============================================
  Channel: {
    NOT_FOUND: "Canal no encontrado.",
    NOT_FOUND_WITH_ID: (channelId: number) => `Canal con ID "${channelId}" no encontrado.`,
    NAME_REQUIRED: "El nombre del canal es obligatorio.",
  },

  // ============================================
  // ERRORES DE COMPAÑÍAS
  // ============================================
  Company: {
    NOT_FOUND: "Compañía no encontrada.",
    NOT_FOUND_WITH_ID: (companyId: number) => `Compañía con ID "${companyId}" no encontrada.`,
    NAME_REQUIRED: "El nombre de la compañía es obligatorio.",
  },

  // ============================================
  // ERRORES DE TARIFAS
  // ============================================
  Rate: {
    NOT_FOUND: "Tarifa no encontrada.",
    NOT_FOUND_WITH_ID: (rateId: number) => `Tarifa con ID "${rateId}" no encontrada.`,
    NAME_REQUIRED: "El nombre de la tarifa es obligatorio.",
    COMPANY_REQUIRED: "La compañía es obligatoria para crear una tarifa.",
  },

  // ============================================
  // ERRORES DE GRUPOS
  // ============================================
  Group: {
    NOT_FOUND: "Grupo no encontrado.",
    NAME_REQUIRED: "El nombre del grupo es obligatorio.",
    USER_NOT_IN_GROUP: "El usuario no pertenece a este grupo.",
  },
};
