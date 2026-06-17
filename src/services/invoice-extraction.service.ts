import axios from "axios";

/**
 * PRES-018 B1 — Extracción automática de datos de facturas energéticas con IA (GPT-4o Vision).
 *
 * Recibe el buffer de una factura (imagen o PDF) y devuelve los campos estructurados que
 * pre-rellenan el asistente de "Nueva comparativa" (hoy 100% manual). El usuario revisa y
 * confirma antes de calcular el ahorro, por lo que la extracción es asistiva, no autoritativa.
 *
 * Modelo: gpt-4o (decisión PRES-018, reutiliza el enfoque del bot Luzia).
 * Requiere el env var OPENAI_API_KEY.
 */

export interface ExtractedInvoiceData {
  comparisonType: "luz" | "gas" | null;
  customerType: "particular" | "empresa" | null;
  clientName: string | null;
  companyName: string | null; // comercializadora actual
  tariffType: string | null; // p.ej. "2.0TD", "3.0TD", "6.1TD" (luz) | "RL.1", "RL.2", "RL.3" (gas)
  cups: string | null;
  potencias: number[] | null; // kW contratados por periodo (luz)
  energias: number[] | null; // kWh consumidos por periodo (luz)
  consumo: number | null; // kWh totales del periodo (gas)
  numDias: number | null; // días del periodo de facturación
  currentBillAmount: number | null; // importe total de la factura (€)
  // Precios unitarios de la tarifa ACTUAL del cliente (la "tarifa antigua" de la comparativa).
  // Se extraen de la factura para poder mostrar el desglose de lo que paga hoy.
  precioPotencia: number[] | null; // SOLO luz: €/kW y día por periodo de potencia
  precioEnergia: number[] | null; // SOLO luz: €/kWh por periodo de energía
  precioExcedentes: number | null; // SOLO luz con autoconsumo: €/kWh de excedentes
  precioFijoGas: number | null; // SOLO gas: término fijo €/día
  precioEnergiaGas: number | null; // SOLO gas: €/kWh
  /** Campos sobre los que el modelo tiene baja confianza; el frontend los resalta para revisión. */
  lowConfidenceFields: string[];
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";

const SYSTEM_PROMPT = `Eres un extractor experto de datos de facturas de energía españolas (luz y gas).
Recibes la imagen o PDF de una factura y devuelves EXCLUSIVAMENTE un objeto JSON con estos campos:
- comparisonType: "luz" si es factura eléctrica, "gas" si es de gas natural. null si no se puede determinar.
- customerType: "particular" o "empresa" (empresa si aparece CIF/razón social mercantil). null si dudoso.
- clientName: nombre del titular tal cual aparece. null si no aparece.
- companyName: comercializadora actual (la empresa que emite la factura). null si no aparece.
- tariffType: peaje de acceso. Luz normalizado a uno de: "2.0TD","3.0TD","6.1TD". Gas a uno de: "RL.1","RL.2","RL.3". null si no se identifica.
- cups: código CUPS (empieza por ES). null si no aparece.
- potencias: SOLO para luz, array de potencias contratadas en kW por periodo. Número de periodos según el peaje: en "2.0TD" hay 2 potencias (P1 punta, P2 valle); en "3.0TD" y "6.1TD" hay 6 (P1..P6). null para gas o si no aparece.
- energias: SOLO para luz, array de energía consumida en kWh por periodo. Número de periodos según el peaje: en "2.0TD" hay 3 energías (P1 punta, P2 llano, P3 valle); en "3.0TD" y "6.1TD" hay 6 (P1..P6). Ojo: en 2.0TD el nº de energías (3) NO coincide con el de potencias (2). null para gas o si no aparece.
- consumo: SOLO para gas, consumo total del periodo en kWh (número). null para luz.
- numDias: número de días del periodo de facturación (entero). null si no aparece.
- currentBillAmount: importe total de la factura en euros (número, usa punto decimal). null si no aparece.
- precioPotencia: SOLO para luz, array con el precio unitario de POTENCIA que paga hoy el cliente en €/kW y día, un valor por periodo de potencia (mismo nº que "potencias"). Es el precio del término de potencia que figura en la factura. null para gas o si no aparece.
- precioEnergia: SOLO para luz, array con el precio unitario de ENERGÍA que paga hoy el cliente en €/kWh, un valor por periodo de energía (mismo nº que "energias"). null para gas o si no aparece.
- precioExcedentes: SOLO para luz con autoconsumo, precio de compensación de excedentes en €/kWh (número). null si no aplica o no aparece.
- precioFijoGas: SOLO para gas, término fijo que paga hoy el cliente en €/día (número). null para luz o si no aparece.
- precioEnergiaGas: SOLO para gas, precio unitario de energía que paga hoy el cliente en €/kWh (número). null para luz o si no aparece.
- lowConfidenceFields: array con los nombres de los campos anteriores cuyo valor sea incierto.

Reglas:
- Usa punto como separador decimal y no incluyas unidades ni símbolos en los números.
- No inventes valores: si un dato no está, devuelve null y añade el campo a lowConfidenceFields.
- Responde solo el JSON, sin texto adicional ni markdown.`;

function buildFileContentPart(buffer: Buffer, mimeType: string, filename: string) {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  if (mimeType === "application/pdf") {
    // GPT-4o admite documentos PDF como content part "file" con data URL base64.
    return {
      type: "file",
      file: { filename, file_data: dataUrl },
    };
  }

  // Imágenes (png/jpg/jpeg) como image_url.
  return {
    type: "image_url",
    image_url: { url: dataUrl },
  };
}

export module InvoiceExtractionService {
  export const extract = async (
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ExtractedInvoiceData> => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const err: any = new Error(
        "OPENAI_API_KEY no configurada: la extracción de facturas con IA no está disponible"
      );
      err.status = 503;
      throw err;
    }

    const filePart = buildFileContentPart(buffer, mimeType, filename);

    const payload = {
      model: MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrae los datos de esta factura energética y devuelve el JSON.",
            },
            filePart,
          ],
        },
      ],
    };

    let content: string;
    try {
      const { data } = await axios.post(OPENAI_URL, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });
      content = data?.choices?.[0]?.message?.content ?? "{}";
    } catch (error: any) {
      const apiMsg = error?.response?.data?.error?.message || error.message;
      const err: any = new Error(`Error al procesar la factura con IA: ${apiMsg}`);
      err.status = 502;
      throw err;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const err: any = new Error("La IA devolvió una respuesta no interpretable");
      err.status = 502;
      throw err;
    }

    return normalize(parsed);
  };
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function toNumberArray(v: any): number[] | null {
  if (!Array.isArray(v)) return null;
  const arr = v.map(toNumber).filter((n): n is number => n !== null);
  return arr.length ? arr : null;
}

function normalize(raw: any): ExtractedInvoiceData {
  const comparisonType =
    raw?.comparisonType === "luz" || raw?.comparisonType === "gas"
      ? raw.comparisonType
      : null;
  const customerType =
    raw?.customerType === "particular" || raw?.customerType === "empresa"
      ? raw.customerType
      : null;

  return {
    comparisonType,
    customerType,
    clientName: raw?.clientName ? String(raw.clientName) : null,
    companyName: raw?.companyName ? String(raw.companyName) : null,
    tariffType: raw?.tariffType ? String(raw.tariffType) : null,
    cups: raw?.cups ? String(raw.cups) : null,
    potencias: toNumberArray(raw?.potencias),
    energias: toNumberArray(raw?.energias),
    consumo: toNumber(raw?.consumo),
    numDias: toNumber(raw?.numDias),
    currentBillAmount: toNumber(raw?.currentBillAmount),
    precioPotencia: toNumberArray(raw?.precioPotencia),
    precioEnergia: toNumberArray(raw?.precioEnergia),
    precioExcedentes: toNumber(raw?.precioExcedentes),
    precioFijoGas: toNumber(raw?.precioFijoGas),
    precioEnergiaGas: toNumber(raw?.precioEnergiaGas),
    lowConfidenceFields: Array.isArray(raw?.lowConfidenceFields)
      ? raw.lowConfidenceFields.map((s: any) => String(s))
      : [],
  };
}
