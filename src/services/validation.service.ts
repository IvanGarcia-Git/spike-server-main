/**
 * Servicio de validación centralizado para el sistema Spikes CRM
 * Proporciona funciones de validación reutilizables con mensajes descriptivos
 */

import {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  OutOfRangeError,
  InvalidLengthError,
  RelationNotFoundError,
} from "../errors/app-errors";
import { dataSource } from "../../app-data-source";
import { User } from "../models/user.entity";
import { Customer } from "../models/customer.entity";
import { Rate } from "../models/rate.entity";
import { Company } from "../models/company.entity";
import { Channel } from "../models/channel.entity";
import { Campaign } from "../models/campaign.entity";
import { ErrorMessages } from "../errors/error-messages";

export module ValidationService {
  // ============================================
  // VALIDACIONES DE CAMPOS BÁSICOS
  // ============================================

  /**
   * Valida que un campo requerido tenga valor
   */
  export const required = (
    value: unknown,
    fieldName: string,
    fieldLabel?: string
  ): void => {
    if (value === undefined || value === null || value === "") {
      throw new RequiredFieldError(fieldName, fieldLabel);
    }
  };

  /**
   * Valida que un string no esté vacío después de trim
   */
  export const notEmpty = (
    value: string | undefined | null,
    fieldName: string,
    fieldLabel?: string
  ): void => {
    if (!value || !value.trim()) {
      throw new RequiredFieldError(fieldName, fieldLabel);
    }
  };

  /**
   * Valida la longitud de un string
   */
  export const length = (
    value: string | undefined | null,
    fieldName: string,
    options: { min?: number; max?: number },
    fieldLabel?: string
  ): void => {
    if (!value) return; // Si es opcional y no tiene valor, no validar

    const len = value.length;
    if (options.min !== undefined && len < options.min) {
      throw new InvalidLengthError(fieldName, options.min, options.max, fieldLabel);
    }
    if (options.max !== undefined && len > options.max) {
      throw new InvalidLengthError(fieldName, options.min, options.max, fieldLabel);
    }
  };

  /**
   * Valida que un número esté dentro de un rango
   */
  export const range = (
    value: number | undefined | null,
    fieldName: string,
    options: { min?: number; max?: number },
    fieldLabel?: string
  ): void => {
    if (value === undefined || value === null) return;

    if (options.min !== undefined && value < options.min) {
      throw new OutOfRangeError(fieldName, options.min, options.max, fieldLabel);
    }
    if (options.max !== undefined && value > options.max) {
      throw new OutOfRangeError(fieldName, options.min, options.max, fieldLabel);
    }
  };

  /**
   * Valida que un valor sea positivo (mayor que 0)
   */
  export const positive = (
    value: number | undefined | null,
    fieldName: string,
    fieldLabel?: string
  ): void => {
    if (value === undefined || value === null) return;

    if (value <= 0) {
      throw new OutOfRangeError(fieldName, 0.01, undefined, fieldLabel);
    }
  };

  /**
   * Valida que un valor sea no negativo (mayor o igual a 0)
   */
  export const nonNegative = (
    value: number | undefined | null,
    fieldName: string,
    fieldLabel?: string
  ): void => {
    if (value === undefined || value === null) return;

    if (value < 0) {
      throw new OutOfRangeError(fieldName, 0, undefined, fieldLabel);
    }
  };

  // ============================================
  // VALIDACIONES DE FORMATO
  // ============================================

  /**
   * Valida formato de email
   */
  export const email = (
    value: string | undefined | null,
    fieldName: string = "email",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new InvalidFormatError(fieldName, "ejemplo@dominio.com", fieldLabel);
    }
  };

  /**
   * Valida formato de teléfono español (9 dígitos)
   */
  export const phoneSpain = (
    value: string | undefined | null,
    fieldName: string = "phoneNumber",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    // Eliminar espacios y guiones
    const cleaned = value.replace(/[\s\-]/g, "");

    // Aceptar formato con o sin prefijo +34
    const phoneRegex = /^(\+34)?[6789]\d{8}$/;
    if (!phoneRegex.test(cleaned)) {
      throw new InvalidFormatError(fieldName, "9 dígitos (ej: 612345678)", fieldLabel);
    }
  };

  /**
   * Valida formato de DNI/NIE español
   */
  export const nationalIdSpain = (
    value: string | undefined | null,
    fieldName: string = "nationalId",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const cleaned = value.toUpperCase().replace(/[\s\-]/g, "");

    // DNI: 8 dígitos + letra
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    // NIE: X/Y/Z + 7 dígitos + letra
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    // NIF empresa: letra + 8 dígitos
    const nifRegex = /^[A-Z][0-9]{8}$/;

    if (!dniRegex.test(cleaned) && !nieRegex.test(cleaned) && !nifRegex.test(cleaned)) {
      throw new InvalidFormatError(fieldName, "DNI (12345678A), NIE (X1234567A) o NIF (A12345678)", fieldLabel);
    }

    // Validar letra de DNI
    if (dniRegex.test(cleaned)) {
      const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
      const number = parseInt(cleaned.substring(0, 8), 10);
      const expectedLetter = letters[number % 23];
      if (cleaned[8] !== expectedLetter) {
        throw new ValidationError(`El ${fieldLabel || fieldName} tiene una letra de control incorrecta.`, {
          field: fieldName,
        });
      }
    }
  };

  /**
   * Valida formato de IBAN español y su dígito de control
   */
  export const ibanSpain = (
    value: string | undefined | null,
    fieldName: string = "iban",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const cleaned = value.toUpperCase().replace(/[\s\-]/g, "");

    // Formato básico: ES + 2 dígitos de control + 20 dígitos
    const ibanRegex = /^ES[0-9]{22}$/;
    if (!ibanRegex.test(cleaned)) {
      throw new InvalidFormatError(fieldName, "ESXX XXXX XXXX XXXX XXXX XXXX", fieldLabel);
    }

    // Validación matemática del IBAN
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    const numericIban = rearranged
      .split("")
      .map((char) => (/[A-Z]/.test(char) ? (char.charCodeAt(0) - 55).toString() : char))
      .join("");

    // Módulo 97
    let remainder = numericIban;
    while (remainder.length > 2) {
      const block = remainder.slice(0, 9);
      remainder = (parseInt(block, 10) % 97).toString() + remainder.slice(9);
    }

    if (parseInt(remainder, 10) % 97 !== 1) {
      throw new ValidationError(`El ${fieldLabel || fieldName} no es válido (dígito de control incorrecto).`, {
        field: fieldName,
      });
    }
  };

  /**
   * Valida formato de CUPS (Código Universal de Punto de Suministro)
   */
  export const cups = (
    value: string | undefined | null,
    fieldName: string = "cups",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const cleaned = value.toUpperCase().replace(/[\s\-]/g, "");

    // CUPS: ES + 16 dígitos + 2 letras de control (+ opcionalmente 2 caracteres más)
    const cupsRegex = /^ES[0-9]{16}[A-Z]{2}([0-9][A-Z])?$/;
    if (!cupsRegex.test(cleaned)) {
      throw new InvalidFormatError(
        fieldName,
        "ESXXXXXXXXXXXXXXXXXX (20-22 caracteres)",
        fieldLabel
      );
    }
  };

  /**
   * Valida formato de código postal español (5 dígitos)
   */
  export const zipCodeSpain = (
    value: string | undefined | null,
    fieldName: string = "zipCode",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const cleaned = value.replace(/\s/g, "");
    const zipRegex = /^[0-9]{5}$/;

    if (!zipRegex.test(cleaned)) {
      throw new InvalidFormatError(fieldName, "5 dígitos (ej: 28001)", fieldLabel);
    }

    // Validar rango de provincias (01-52)
    const province = parseInt(cleaned.substring(0, 2), 10);
    if (province < 1 || province > 52) {
      throw new ValidationError(
        `El ${fieldLabel || fieldName} tiene un código de provincia inválido.`,
        { field: fieldName }
      );
    }
  };

  /**
   * Valida formato de fecha YYYY-MM-DD
   */
  export const dateFormat = (
    value: string | undefined | null,
    fieldName: string = "date",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new InvalidFormatError(fieldName, "YYYY-MM-DD (ej: 2024-12-31)", fieldLabel);
    }

    // Validar que sea una fecha real
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`El ${fieldLabel || fieldName} no es una fecha válida.`, {
        field: fieldName,
      });
    }
  };

  /**
   * Valida que una fecha no sea en el pasado
   */
  export const dateNotPast = (
    value: Date | string | undefined | null,
    fieldName: string = "date",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    const date = typeof value === "string" ? new Date(value) : value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new ValidationError(
        `El ${fieldLabel || fieldName} no puede ser una fecha en el pasado.`,
        { field: fieldName }
      );
    }
  };

  /**
   * Valida formato de nombre de usuario
   */
  export const username = (
    value: string | undefined | null,
    fieldName: string = "username",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    // Solo letras, números, guiones bajos y puntos
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(value)) {
      throw new InvalidFormatError(
        fieldName,
        "solo letras, números, guiones bajos y puntos",
        fieldLabel
      );
    }

    if (value.length < 4) {
      throw new InvalidLengthError(fieldName, 4, 50, fieldLabel);
    }
  };

  /**
   * Valida fortaleza de contraseña
   */
  export const password = (
    value: string | undefined | null,
    fieldName: string = "password",
    fieldLabel?: string
  ): void => {
    if (!value) return;

    if (value.length < 8) {
      throw new InvalidLengthError(fieldName, 8, undefined, fieldLabel);
    }

    // Opcional: validar complejidad
    // const hasUpper = /[A-Z]/.test(value);
    // const hasLower = /[a-z]/.test(value);
    // const hasNumber = /[0-9]/.test(value);
    // if (!hasUpper || !hasLower || !hasNumber) {
    //   throw new ValidationError(ErrorMessages.Auth.WEAK_PASSWORD, { field: fieldName });
    // }
  };

  // ============================================
  // VALIDACIONES DE ENUM/OPCIONES
  // ============================================

  /**
   * Valida que un valor esté dentro de opciones permitidas
   */
  export const oneOf = <T>(
    value: T | undefined | null,
    allowedValues: T[],
    fieldName: string,
    fieldLabel?: string
  ): void => {
    if (value === undefined || value === null) return;

    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `El ${fieldLabel || fieldName} debe ser uno de: ${allowedValues.join(", ")}.`,
        {
          field: fieldName,
          allowedValues,
          receivedValue: value,
        }
      );
    }
  };

  // ============================================
  // VALIDACIONES DE RELACIONES (async)
  // ============================================

  /**
   * Valida que un usuario exista
   */
  export const userExists = async (
    userId: number | undefined | null,
    parentEntity?: string
  ): Promise<User | null> => {
    if (!userId) return null;

    const user = await dataSource.getRepository(User).findOneBy({ id: userId });
    if (!user) {
      throw new RelationNotFoundError("Usuario", userId, parentEntity);
    }
    return user;
  };

  /**
   * Valida que un cliente exista
   */
  export const customerExists = async (
    customerId: number | undefined | null,
    parentEntity?: string
  ): Promise<Customer | null> => {
    if (!customerId) return null;

    const customer = await dataSource.getRepository(Customer).findOneBy({ id: customerId });
    if (!customer) {
      throw new RelationNotFoundError("Cliente", customerId, parentEntity);
    }
    return customer;
  };

  /**
   * Valida que una tarifa exista
   */
  export const rateExists = async (
    rateId: number | undefined | null,
    parentEntity?: string
  ): Promise<Rate | null> => {
    if (!rateId) return null;

    const rate = await dataSource.getRepository(Rate).findOneBy({ id: rateId });
    if (!rate) {
      throw new RelationNotFoundError("Tarifa", rateId, parentEntity);
    }
    return rate;
  };

  /**
   * Valida que una compañía exista
   */
  export const companyExists = async (
    companyId: number | undefined | null,
    parentEntity?: string
  ): Promise<Company | null> => {
    if (!companyId) return null;

    const company = await dataSource.getRepository(Company).findOneBy({ id: companyId });
    if (!company) {
      throw new RelationNotFoundError("Compañía", companyId, parentEntity);
    }
    return company;
  };

  /**
   * Valida que un canal exista
   */
  export const channelExists = async (
    channelId: number | undefined | null,
    parentEntity?: string
  ): Promise<Channel | null> => {
    if (!channelId) return null;

    const channel = await dataSource.getRepository(Channel).findOneBy({ id: channelId });
    if (!channel) {
      throw new RelationNotFoundError("Canal", channelId, parentEntity);
    }
    return channel;
  };

  /**
   * Valida que una campaña exista
   */
  export const campaignExists = async (
    campaignId: number | undefined | null,
    parentEntity?: string
  ): Promise<Campaign | null> => {
    if (!campaignId) return null;

    const campaign = await dataSource.getRepository(Campaign).findOneBy({ id: campaignId });
    if (!campaign) {
      throw new RelationNotFoundError("Campaña", campaignId, parentEntity);
    }
    return campaign;
  };

  // ============================================
  // HELPERS DE VALIDACIÓN MÚLTIPLE
  // ============================================

  /**
   * Ejecuta múltiples validaciones y recopila todos los errores
   */
  export const validateAll = async (
    validations: (() => void | Promise<void>)[]
  ): Promise<void> => {
    const errors: string[] = [];

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error.message);
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(" "), {
        multipleErrors: true,
        errorCount: errors.length,
      });
    }
  };
}
