import { dataSource } from "../../app-data-source";
import { CommissionTier } from "../models/commission-tier.entity";
import { Rate } from "../models/rate.entity";

export interface CreateCommissionTierDTO {
  rateId: number;
  minConsumo: number;
  maxConsumo: number | null;
  comision: number;
  appliesToRenewal?: boolean;
}

export interface UpdateCommissionTierDTO {
  minConsumo?: number;
  maxConsumo?: number | null;
  comision?: number;
  appliesToRenewal?: boolean;
}

export module CommissionTiersService {
  const repo = () => dataSource.getRepository(CommissionTier);

  export const listByRate = async (rateId: number): Promise<CommissionTier[]> => {
    return repo().find({
      where: { rateId },
      order: { minConsumo: "ASC" },
    });
  };

  export const create = async (dto: CreateCommissionTierDTO): Promise<CommissionTier> => {
    // Validar que min <= max si max no es null
    if (dto.maxConsumo !== null && dto.minConsumo > dto.maxConsumo) {
      throw new Error("minConsumo debe ser menor o igual a maxConsumo");
    }

    // Validar solapes con tramos existentes
    const existingTiers = await listByRate(dto.rateId);
    const hasOverlap = existingTiers.some((tier) => {
      const tierMax = tier.maxConsumo ?? Infinity;
      const newMax = dto.maxConsumo ?? Infinity;
      // Dos rangos se solapan si: start1 <= end2 AND start2 <= end1
      return dto.minConsumo <= tierMax && tier.minConsumo <= newMax;
    });

    if (hasOverlap) {
      throw new Error("El tramo se solapa con uno existente");
    }

    const tier = repo().create({
      rateId: dto.rateId,
      rate: { id: dto.rateId } as Rate,
      minConsumo: dto.minConsumo,
      maxConsumo: dto.maxConsumo,
      comision: dto.comision,
      appliesToRenewal: dto.appliesToRenewal ?? false,
    });

    return repo().save(tier);
  };

  export const update = async (id: number, dto: UpdateCommissionTierDTO): Promise<CommissionTier> => {
    const tier = await repo().findOne({ where: { id } });
    if (!tier) {
      throw new Error("Tramo no encontrado");
    }

    const newMin = dto.minConsumo ?? tier.minConsumo;
    const newMax = dto.maxConsumo !== undefined ? dto.maxConsumo : tier.maxConsumo;

    // Validar min <= max
    if (newMax !== null && newMin > newMax) {
      throw new Error("minConsumo debe ser menor o igual a maxConsumo");
    }

    // Validar solapes (excluyendo el tramo actual)
    const existingTiers = await listByRate(tier.rateId);
    const hasOverlap = existingTiers.some((t) => {
      if (t.id === id) return false;
      const tierMax = t.maxConsumo ?? Infinity;
      const checkMax = newMax ?? Infinity;
      return newMin <= tierMax && t.minConsumo <= checkMax;
    });

    if (hasOverlap) {
      throw new Error("El tramo se solapa con uno existente");
    }

    if (dto.minConsumo !== undefined) tier.minConsumo = dto.minConsumo;
    if (dto.maxConsumo !== undefined) tier.maxConsumo = dto.maxConsumo;
    if (dto.comision !== undefined) tier.comision = dto.comision;
    if (dto.appliesToRenewal !== undefined) tier.appliesToRenewal = dto.appliesToRenewal;

    return repo().save(tier);
  };

  export const remove = async (id: number): Promise<void> => {
    await repo().delete(id);
  };

  /**
   * Calcula la comision para un consumo dado en una tarifa.
   * Si no hay tramo que aplique, devuelve la comision base (paymentMoney) de la tarifa.
   * @param rateId ID de la tarifa
   * @param consumo Consumo a calcular
   * @param isRenewal Si es un pago de renovacion
   * @returns La comision aplicable o null si no hay tarifa
   */
  export const calculateCommission = async (
    rateId: number,
    consumo: number,
    isRenewal: boolean = false
  ): Promise<number | null> => {
    const rateRepo = dataSource.getRepository(Rate);
    const rate = await rateRepo.findOne({ where: { id: rateId } });
    if (!rate) return null;

    const tiers = await listByRate(rateId);

    // Filtrar tramos que aplican a renovacion si es el caso
    const applicableTiers = isRenewal
      ? tiers.filter((t) => t.appliesToRenewal)
      : tiers;

    // Buscar el tramo que contiene el consumo
    let matchedTier: CommissionTier | undefined;
    let smallestRange = Infinity;

    for (const tier of applicableTiers) {
      const min = tier.minConsumo;
      const max = tier.maxConsumo ?? Infinity;

      if (consumo >= min && consumo <= max) {
        // Priorizar el tramo mas especifico (rango mas pequeno)
        const range = max - min;
        if (range < smallestRange) {
          smallestRange = range;
          matchedTier = tier;
        }
      }
    }

    if (matchedTier) {
      return matchedTier.comision;
    }

    // Fallback a la comision base de la tarifa
    return rate.paymentMoney ?? 0;
  };

  /**
   * Bulk upsert de tramos para una tarifa.
   * Elimina los tramos que no estan en la lista y crea/actualiza los demas.
   */
  export const bulkUpsert = async (
    rateId: number,
    tiers: Array<{
      id?: number;
      minConsumo: number;
      maxConsumo: number | null;
      comision: number;
      appliesToRenewal?: boolean;
    }>
  ): Promise<CommissionTier[]> => {
    const repository = repo();

    // Validar que no haya solapes entre los tramos nuevos
    for (let i = 0; i < tiers.length; i++) {
      const t1 = tiers[i];
      if (t1.maxConsumo !== null && t1.minConsumo > t1.maxConsumo) {
        throw new Error(`Tramo ${i + 1}: minConsumo debe ser menor o igual a maxConsumo`);
      }

      for (let j = i + 1; j < tiers.length; j++) {
        const t2 = tiers[j];
        const max1 = t1.maxConsumo ?? Infinity;
        const max2 = t2.maxConsumo ?? Infinity;
        if (t1.minConsumo <= max2 && t2.minConsumo <= max1) {
          throw new Error(`Los tramos ${i + 1} y ${j + 1} se solapan`);
        }
      }
    }

    // Obtener IDs existentes
    const existingTiers = await listByRate(rateId);
    const existingIds = existingTiers.map((t) => t.id);
    const newIds = tiers.filter((t) => t.id).map((t) => t.id!);

    // Eliminar tramos que ya no estan
    const toDelete = existingIds.filter((id) => !newIds.includes(id));
    if (toDelete.length > 0) {
      await repository.delete(toDelete);
    }

    // Crear o actualizar
    const results: CommissionTier[] = [];
    for (const tierData of tiers) {
      if (tierData.id) {
        // Update
        const tier = await repository.findOne({ where: { id: tierData.id } });
        if (tier) {
          tier.minConsumo = tierData.minConsumo;
          tier.maxConsumo = tierData.maxConsumo;
          tier.comision = tierData.comision;
          tier.appliesToRenewal = tierData.appliesToRenewal ?? false;
          results.push(await repository.save(tier));
        }
      } else {
        // Create
        const tier = repository.create({
          rateId,
          rate: { id: rateId } as Rate,
          minConsumo: tierData.minConsumo,
          maxConsumo: tierData.maxConsumo,
          comision: tierData.comision,
          appliesToRenewal: tierData.appliesToRenewal ?? false,
        });
        results.push(await repository.save(tier));
      }
    }

    return results;
  };
}
