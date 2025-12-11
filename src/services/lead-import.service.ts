import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";
import { dataSource } from "../../app-data-source";
import { Lead } from "../models/lead.entity";
import { Campaign } from "../models/campaign.entity";
import { LeadsService } from "./leads.service";
import {
  LeadImportRowDTO,
  LeadImportErrorRowDTO,
  LeadImportDuplicateRowDTO,
  LeadImportPreviewResponseDTO,
  LeadImportConfirmResponseDTO,
} from "../dto/lead-import.dto";

interface PreviewSession {
  data: LeadImportRowDTO[];
  createdAt: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const previewSessions: Map<string, PreviewSession> = new Map();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of previewSessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      previewSessions.delete(sessionId);
    }
  }
}, 10 * 60 * 1000);

export module LeadImportService {
  const EXPECTED_HEADERS = ["nombre", "email", "telefono", "campana", "fuente"];
  const REQUIRED_HEADERS = ["nombre", "telefono", "campana"];

  export const parseExcel = (file: Express.Multer.File): LeadImportRowDTO[] => {
    try {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("El archivo Excel no contiene hojas de datos");
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        header: 1,
        defval: "",
      });

      if (jsonData.length < 2) {
        throw new Error("El archivo Excel debe contener al menos una fila de encabezados y una fila de datos");
      }

      // Get headers from first row
      const headers = (jsonData[0] as string[]).map((h) =>
        String(h).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      );

      // Validate required headers
      const missingHeaders = REQUIRED_HEADERS.filter(
        (required) => !headers.includes(required)
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `Faltan columnas obligatorias: ${missingHeaders.join(", ")}. ` +
          `Columnas esperadas: ${EXPECTED_HEADERS.join(", ")}`
        );
      }

      // Map headers to indices
      const headerIndices = {
        nombre: headers.indexOf("nombre"),
        email: headers.indexOf("email"),
        telefono: headers.indexOf("telefono"),
        campana: headers.indexOf("campana"),
        fuente: headers.indexOf("fuente"),
      };

      // Parse data rows
      const rows: LeadImportRowDTO[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];

        // Skip completely empty rows
        if (!row || row.every((cell) => !cell || String(cell).trim() === "")) {
          continue;
        }

        const getValue = (index: number): string => {
          if (index === -1) return "";
          const value = row[index];
          return value !== undefined && value !== null ? String(value).trim() : "";
        };

        rows.push({
          rowNumber: i + 1, // Excel rows are 1-indexed, +1 for header
          fullName: getValue(headerIndices.nombre),
          email: getValue(headerIndices.email),
          phoneNumber: normalizePhoneNumber(getValue(headerIndices.telefono)),
          campaignName: getValue(headerIndices.campana),
          campaignSource: getValue(headerIndices.fuente) || "Excel Import",
        });
      }

      if (rows.length === 0) {
        throw new Error("El archivo Excel no contiene datos para importar");
      }

      return rows;
    } catch (error) {
      if (error.message) {
        throw error;
      }
      throw new Error("Error al procesar el archivo Excel. Verifica que el formato sea correcto.");
    }
  };

  const normalizePhoneNumber = (phone: string): string => {
    // Remove spaces, dashes, and other non-digit characters except +
    return phone.replace(/[^\d+]/g, "");
  };

  export const validateRows = (
    rows: LeadImportRowDTO[]
  ): { valid: LeadImportRowDTO[]; errors: LeadImportErrorRowDTO[] } => {
    const valid: LeadImportRowDTO[] = [];
    const errors: LeadImportErrorRowDTO[] = [];

    for (const row of rows) {
      const rowErrors: string[] = [];

      // Validate required fields
      if (!row.fullName || row.fullName.trim() === "") {
        rowErrors.push("Nombre es obligatorio");
      }

      if (!row.phoneNumber || row.phoneNumber.trim() === "") {
        rowErrors.push("Teléfono es obligatorio");
      } else {
        // Validate Spanish phone format
        const cleanPhone = row.phoneNumber.replace(/^\+34/, "");
        const phoneRegex = /^[6789]\d{8}$/;
        if (!phoneRegex.test(cleanPhone)) {
          rowErrors.push("Formato de teléfono inválido (debe ser 9 dígitos comenzando por 6, 7, 8 o 9)");
        }
      }

      if (!row.campaignName || row.campaignName.trim() === "") {
        rowErrors.push("Nombre de campaña es obligatorio");
      }

      // Validate email format if provided
      if (row.email && row.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          rowErrors.push("Formato de email inválido");
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: row.rowNumber,
          data: row,
          errors: rowErrors,
        });
      } else {
        valid.push(row);
      }
    }

    return { valid, errors };
  };

  export const detectDuplicates = async (
    rows: LeadImportRowDTO[]
  ): Promise<{ clean: LeadImportRowDTO[]; duplicates: LeadImportDuplicateRowDTO[] }> => {
    const leadRepository = dataSource.getRepository(Lead);
    const campaignRepository = dataSource.getRepository(Campaign);

    const clean: LeadImportRowDTO[] = [];
    const duplicates: LeadImportDuplicateRowDTO[] = [];

    // Get all phone numbers from the rows
    const phoneNumbers = rows.map((r) => r.phoneNumber.replace(/^\+34/, ""));

    // Batch query for existing leads by phone
    const existingLeadsByPhone = await leadRepository
      .createQueryBuilder("lead")
      .where("REPLACE(lead.phoneNumber, '+34', '') IN (:...phones)", { phones: phoneNumbers.length > 0 ? phoneNumbers : [""] })
      .getMany();

    const existingPhoneSet = new Set(
      existingLeadsByPhone.map((l) => l.phoneNumber.replace(/^\+34/, ""))
    );

    // Get all campaigns for email+campaign duplicate check
    const campaignNames = [...new Set(rows.map((r) => r.campaignName))];
    const existingCampaigns = await campaignRepository
      .createQueryBuilder("campaign")
      .where("campaign.name IN (:...names)", { names: campaignNames.length > 0 ? campaignNames : [""] })
      .getMany();

    const campaignIdMap = new Map<string, number>();
    for (const campaign of existingCampaigns) {
      campaignIdMap.set(campaign.name, campaign.id);
    }

    // Check for email duplicates within existing campaigns
    for (const row of rows) {
      const cleanPhone = row.phoneNumber.replace(/^\+34/, "");

      // Check phone duplicate
      if (existingPhoneSet.has(cleanPhone)) {
        duplicates.push({
          rowNumber: row.rowNumber,
          data: row,
          reason: `Teléfono '${row.phoneNumber}' ya existe en el sistema`,
        });
        continue;
      }

      // Check email+campaign duplicate
      if (row.email && row.email.trim() !== "") {
        const campaignId = campaignIdMap.get(row.campaignName);
        if (campaignId) {
          const existingByEmail = await leadRepository.findOne({
            where: {
              email: row.email,
              campaignId: campaignId,
            },
          });

          if (existingByEmail) {
            duplicates.push({
              rowNumber: row.rowNumber,
              data: row,
              reason: `Email '${row.email}' ya existe en la campaña '${row.campaignName}'`,
            });
            continue;
          }
        }
      }

      clean.push(row);
    }

    return { clean, duplicates };
  };

  export const createPreviewSession = (rows: LeadImportRowDTO[]): string => {
    const sessionId = uuidv4();
    previewSessions.set(sessionId, {
      data: rows,
      createdAt: Date.now(),
    });
    return sessionId;
  };

  export const getPreviewSession = (sessionId: string): LeadImportRowDTO[] | null => {
    const session = previewSessions.get(sessionId);
    if (!session) {
      return null;
    }

    if (Date.now() - session.createdAt > SESSION_TIMEOUT) {
      previewSessions.delete(sessionId);
      return null;
    }

    return session.data;
  };

  export const cleanupSession = (sessionId: string): void => {
    previewSessions.delete(sessionId);
  };

  export const processPreview = async (
    file: Express.Multer.File
  ): Promise<LeadImportPreviewResponseDTO> => {
    // Parse Excel
    const allRows = parseExcel(file);

    // Validate rows
    const { valid: validatedRows, errors: errorRows } = validateRows(allRows);

    // Detect duplicates in validated rows
    const { clean: cleanRows, duplicates: duplicateRows } = await detectDuplicates(validatedRows);

    // Create session with all rows that can potentially be imported (valid + duplicates)
    // Duplicates will be created with "Repetido" state as per user request
    const importableRows = [...cleanRows, ...duplicateRows.map(d => d.data)];
    const sessionId = createPreviewSession(importableRows);

    return {
      sessionId,
      validRows: cleanRows,
      errorRows,
      duplicateRows,
      summary: {
        total: allRows.length,
        valid: cleanRows.length,
        errors: errorRows.length,
        duplicates: duplicateRows.length,
      },
    };
  };

  export const confirmImport = async (
    sessionId: string,
    rowsToImport: number[]
  ): Promise<LeadImportConfirmResponseDTO> => {
    const sessionRows = getPreviewSession(sessionId);

    if (!sessionRows) {
      throw new Error("La sesión de importación ha expirado o no existe. Por favor, suba el archivo nuevamente.");
    }

    // Filter rows to import
    const rowsToProcess = sessionRows.filter((row) =>
      rowsToImport.includes(row.rowNumber)
    );

    if (rowsToProcess.length === 0) {
      throw new Error("No se seleccionaron filas para importar");
    }

    const created: number[] = [];
    const failed: { rowNumber: number; error: string }[] = [];
    const campaignsCreated = new Set<string>();

    for (const row of rowsToProcess) {
      try {
        const lead = await LeadsService.create({
          fullName: row.fullName,
          phoneNumber: row.phoneNumber,
          email: row.email,
          campaignName: row.campaignName,
          campaignSource: row.campaignSource,
        });

        created.push(row.rowNumber);

        // Track if this was a new campaign
        if (lead.campaignId) {
          campaignsCreated.add(row.campaignName);
        }
      } catch (error) {
        failed.push({
          rowNumber: row.rowNumber,
          error: error.message || "Error desconocido al crear lead",
        });
      }
    }

    // Cleanup session after import
    cleanupSession(sessionId);

    return {
      created: created.length,
      failed,
      campaignsCreated: Array.from(campaignsCreated),
    };
  };

  export const generateTemplate = (): Buffer => {
    const templateData = [
      ["nombre", "email", "telefono", "campana", "fuente"],
      ["Juan Pérez García", "juan@email.com", "612345678", "Luz Verano 2024", "Landing Page"],
      ["María López", "", "698765432", "Gas Invierno 2024", "Facebook"],
      ["Carlos Rodríguez", "carlos@email.com", "611222333", "Luz Verano 2024", ""],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_array(templateData);
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // nombre
      { wch: 25 }, // email
      { wch: 15 }, // telefono
      { wch: 25 }, // campana
      { wch: 20 }, // fuente
    ];

    XLSX.utils.book_append_sheet(workbook, ws, "Plantilla Leads");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  };
}
