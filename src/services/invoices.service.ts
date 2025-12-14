import { dataSource } from "../../app-data-source";
import { Invoice, InvoiceType } from "../models/invoice.entity";
import { User } from "../models/user.entity";

export interface CreateInvoiceDTO {
  invoiceNumber: string;
  type: InvoiceType;
  clientName: string;
  clientNationalId?: string | null;
  clientAddress?: string | null;
  concept: string;
  invoiceDate: string;
  dueDate?: string | null;
  paymentMethod?: string | null;
  iban?: string | null;
  subtotal: number;
  ivaPercentage?: number;
  ivaAmount?: number;
  irpfPercentage?: number;
  irpfAmount?: number;
  total: number;
  items?: string | null;
  notes?: string | null;
  pdfFilename?: string | null;
  userId?: number | null;
  channelId?: number | null;
}

export interface UpdateInvoiceDTO {
  invoiceNumber?: string;
  type?: InvoiceType;
  clientName?: string;
  clientNationalId?: string | null;
  clientAddress?: string | null;
  concept?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  paymentMethod?: string | null;
  iban?: string | null;
  subtotal?: number;
  ivaPercentage?: number;
  ivaAmount?: number;
  irpfPercentage?: number;
  irpfAmount?: number;
  total?: number;
  items?: string | null;
  notes?: string | null;
  pdfFilename?: string | null;
}

export module InvoicesService {
  const invoiceRepository = dataSource.getRepository(Invoice);
  const userRepository = dataSource.getRepository(User);

  export const create = async (dto: CreateInvoiceDTO): Promise<Invoice> => {
    // Validar tipo obligatorio
    if (!dto.type || !Object.values(InvoiceType).includes(dto.type)) {
      throw new Error("El tipo de factura es obligatorio (COBRO o PAGO).");
    }

    // Si se proporciona userId, verificar que el usuario exista
    if (dto.userId !== undefined && dto.userId !== null) {
      const targetUser = await userRepository.findOneBy({ id: dto.userId });
      if (!targetUser) {
        throw new Error(`User with ID ${dto.userId} not found.`);
      }
    }

    const newInvoice = invoiceRepository.create({
      invoiceNumber: dto.invoiceNumber,
      type: dto.type,
      clientName: dto.clientName,
      clientNationalId: dto.clientNationalId || null,
      clientAddress: dto.clientAddress || null,
      concept: dto.concept,
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate || null,
      paymentMethod: dto.paymentMethod || null,
      iban: dto.iban || null,
      subtotal: dto.subtotal || 0,
      ivaPercentage: dto.ivaPercentage || 0,
      ivaAmount: dto.ivaAmount || 0,
      irpfPercentage: dto.irpfPercentage || 0,
      irpfAmount: dto.irpfAmount || 0,
      total: dto.total || 0,
      items: dto.items || null,
      notes: dto.notes || null,
      pdfFilename: dto.pdfFilename || null,
      userId: dto.userId !== undefined ? dto.userId : null,
      channelId: dto.channelId !== undefined ? dto.channelId : null,
    });

    try {
      return await invoiceRepository.save(newInvoice);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe una factura con este número.");
      }
      console.error("Error saving invoice:", error);
      throw new Error("Error al guardar la factura.");
    }
  };

  export const getByUuid = async (uuid: string): Promise<Invoice | null> => {
    return await invoiceRepository.findOne({
      where: { uuid },
      relations: ["user", "channel"],
    });
  };

  export const getById = async (id: number): Promise<Invoice | null> => {
    return await invoiceRepository.findOne({
      where: { id },
      relations: ["user", "channel"],
    });
  };

  export const update = async (
    uuid: string,
    dto: UpdateInvoiceDTO,
    requestingUserId: number,
    isManager: boolean
  ): Promise<Invoice> => {
    const invoice = await getByUuid(uuid);
    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // Permission check: Owner or Manager
    if (invoice.userId !== null && invoice.userId !== requestingUserId && !isManager) {
      throw new Error("Sin permisos para editar esta factura");
    }
    if (invoice.userId === null && !isManager) {
      throw new Error("Sin permisos para editar esta factura");
    }

    if (dto.invoiceNumber !== undefined) invoice.invoiceNumber = dto.invoiceNumber;
    if (dto.type !== undefined) invoice.type = dto.type;
    if (dto.clientName !== undefined) invoice.clientName = dto.clientName;
    if (dto.clientNationalId !== undefined) invoice.clientNationalId = dto.clientNationalId;
    if (dto.clientAddress !== undefined) invoice.clientAddress = dto.clientAddress;
    if (dto.concept !== undefined) invoice.concept = dto.concept;
    if (dto.invoiceDate !== undefined) invoice.invoiceDate = dto.invoiceDate;
    if (dto.dueDate !== undefined) invoice.dueDate = dto.dueDate;
    if (dto.paymentMethod !== undefined) invoice.paymentMethod = dto.paymentMethod;
    if (dto.iban !== undefined) invoice.iban = dto.iban;
    if (dto.subtotal !== undefined) invoice.subtotal = dto.subtotal;
    if (dto.ivaPercentage !== undefined) invoice.ivaPercentage = dto.ivaPercentage;
    if (dto.ivaAmount !== undefined) invoice.ivaAmount = dto.ivaAmount;
    if (dto.irpfPercentage !== undefined) invoice.irpfPercentage = dto.irpfPercentage;
    if (dto.irpfAmount !== undefined) invoice.irpfAmount = dto.irpfAmount;
    if (dto.total !== undefined) invoice.total = dto.total;
    if (dto.items !== undefined) invoice.items = dto.items;
    if (dto.notes !== undefined) invoice.notes = dto.notes;
    if (dto.pdfFilename !== undefined) invoice.pdfFilename = dto.pdfFilename;

    try {
      return await invoiceRepository.save(invoice);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe una factura con este número.");
      }
      throw error;
    }
  };

  export const remove = async (
    uuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<void> => {
    const invoice = await getByUuid(uuid);
    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // Permission check: Owner or Manager
    if (invoice.userId !== null && invoice.userId !== requestingUserId && !isManager) {
      throw new Error("Sin permisos para eliminar esta factura");
    }
    if (invoice.userId === null && !isManager) {
      throw new Error("Sin permisos para eliminar esta factura");
    }

    await invoiceRepository.remove(invoice);
  };

  export const findByUser = async (userId: number): Promise<Invoice[]> => {
    return await invoiceRepository.find({
      where: { userId },
      relations: ["user", "channel"],
      order: { invoiceDate: "DESC", createdAt: "DESC" },
    });
  };

  export const findAll = async (): Promise<Invoice[]> => {
    return await invoiceRepository.find({
      relations: ["user", "channel"],
      order: { invoiceDate: "DESC", createdAt: "DESC" },
    });
  };

  // Obtener las últimas N facturas (para el historial)
  export const findRecent = async (limit: number = 10, userId?: number): Promise<Invoice[]> => {
    const queryBuilder = invoiceRepository
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.user", "user")
      .leftJoinAndSelect("invoice.channel", "channel")
      .orderBy("invoice.createdAt", "DESC")
      .take(limit);

    if (userId) {
      queryBuilder.where("invoice.userId = :userId", { userId });
    }

    return await queryBuilder.getMany();
  };

  // Obtener facturas por tipo
  export const findByType = async (type: InvoiceType, userId?: number): Promise<Invoice[]> => {
    const whereCondition: any = { type };
    if (userId) {
      whereCondition.userId = userId;
    }

    return await invoiceRepository.find({
      where: whereCondition,
      relations: ["user", "channel"],
      order: { invoiceDate: "DESC", createdAt: "DESC" },
    });
  };

  // Obtener siguiente número de factura sugerido
  export const getNextInvoiceNumber = async (prefix: string = "F"): Promise<string> => {
    const lastInvoice = await invoiceRepository
      .createQueryBuilder("invoice")
      .where("invoice.invoiceNumber LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("invoice.invoiceNumber", "DESC")
      .getOne();

    if (!lastInvoice) {
      return `${prefix}00001`;
    }

    // Extraer el número del último invoice
    const lastNumber = lastInvoice.invoiceNumber.replace(prefix, "");
    const nextNumber = parseInt(lastNumber, 10) + 1;
    return `${prefix}${nextNumber.toString().padStart(5, "0")}`;
  };
}
