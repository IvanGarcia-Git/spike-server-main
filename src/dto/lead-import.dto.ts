export interface LeadImportRowDTO {
  rowNumber: number;
  fullName: string;
  email?: string;
  phoneNumber: string;
  campaignName: string;
  campaignSource?: string;
}

export interface LeadImportErrorRowDTO {
  rowNumber: number;
  data: Partial<LeadImportRowDTO>;
  errors: string[];
}

export interface LeadImportDuplicateRowDTO {
  rowNumber: number;
  data: LeadImportRowDTO;
  reason: string;
}

export interface LeadImportPreviewResponseDTO {
  sessionId: string;
  validRows: LeadImportRowDTO[];
  errorRows: LeadImportErrorRowDTO[];
  duplicateRows: LeadImportDuplicateRowDTO[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
  };
}

export interface LeadImportConfirmRequestDTO {
  sessionId: string;
  rowsToImport: number[];
}

export interface LeadImportConfirmResponseDTO {
  created: number;
  failed: {
    rowNumber: number;
    error: string;
  }[];
  campaignsCreated: string[];
}
