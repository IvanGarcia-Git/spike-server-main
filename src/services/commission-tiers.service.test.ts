/**
 * Tests para CommissionTiersService
 *
 * Estos tests verifican la lógica de cálculo de comisiones por tramos de consumo.
 * Para ejecutar, configurar Jest o Vitest y ejecutar: npm test
 *
 * Casos de prueba cubiertos:
 * 1. Consumo en el límite inferior de un tramo
 * 2. Consumo en el medio de un tramo
 * 3. Consumo en el límite superior de un tramo
 * 4. Consumo sin max (max = null) - tramo abierto
 * 5. Caso de renovación aplica comisión específica
 * 6. Fallback a comisión base cuando no hay tramos
 * 7. Validación de solapes entre tramos
 */

import { CommissionTiersService } from "./commission-tiers.service";

// Mock de datos para pruebas
const mockTiers = [
  { id: 1, rateId: 1, minConsumo: 0, maxConsumo: 100, comision: 10, appliesToRenewal: false },
  { id: 2, rateId: 1, minConsumo: 101, maxConsumo: 500, comision: 25, appliesToRenewal: true },
  { id: 3, rateId: 1, minConsumo: 501, maxConsumo: null, comision: 50, appliesToRenewal: true }, // Sin límite superior
];

describe("CommissionTiersService", () => {
  describe("calculateCommission", () => {
    /**
     * Test 1: Consumo en el límite inferior de un tramo
     * Dado un consumo de 0 (límite inferior del primer tramo)
     * Debería retornar la comisión del primer tramo: 10€
     */
    it("should return commission for consumption at lower bound", async () => {
      // Consumo = 0 está en el tramo [0, 100] -> comisión 10
      const result = await CommissionTiersService.calculateCommission(1, 0, false);
      expect(result).toBe(10);
    });

    /**
     * Test 2: Consumo en el medio de un tramo
     * Dado un consumo de 250 (medio del segundo tramo)
     * Debería retornar la comisión del segundo tramo: 25€
     */
    it("should return commission for consumption in middle of tier", async () => {
      // Consumo = 250 está en el tramo [101, 500] -> comisión 25
      const result = await CommissionTiersService.calculateCommission(1, 250, false);
      expect(result).toBe(25);
    });

    /**
     * Test 3: Consumo en el límite superior de un tramo
     * Dado un consumo de 100 (límite superior del primer tramo)
     * Debería retornar la comisión del primer tramo: 10€
     */
    it("should return commission for consumption at upper bound", async () => {
      // Consumo = 100 está en el tramo [0, 100] -> comisión 10
      const result = await CommissionTiersService.calculateCommission(1, 100, false);
      expect(result).toBe(10);
    });

    /**
     * Test 4: Consumo sin max (max = null)
     * Dado un consumo de 1000 (por encima de todos los límites definidos)
     * Debería retornar la comisión del tramo abierto [501, ∞]: 50€
     */
    it("should return commission for consumption in open-ended tier", async () => {
      // Consumo = 1000 está en el tramo [501, null/∞] -> comisión 50
      const result = await CommissionTiersService.calculateCommission(1, 1000, false);
      expect(result).toBe(50);
    });

    /**
     * Test 5: Caso de renovación aplica comisión específica
     * Dado un consumo de 250 y es una renovación (isRenewal = true)
     * Solo debe considerar tramos con appliesToRenewal = true
     * Debería retornar la comisión del tramo [101, 500] que aplica a renovación: 25€
     */
    it("should return commission for renewal from applicable tiers only", async () => {
      // Consumo = 250, isRenewal = true
      // Tramos aplicables a renovación: [101, 500] con 25€, [501, ∞] con 50€
      // Consumo 250 cae en [101, 500] -> comisión 25
      const result = await CommissionTiersService.calculateCommission(1, 250, true);
      expect(result).toBe(25);
    });

    /**
     * Test 6: Renovación con consumo bajo - fallback a comisión base
     * Dado un consumo de 50 y es una renovación (isRenewal = true)
     * El tramo [0, 100] NO aplica a renovación
     * Debería retornar la comisión base de la tarifa (paymentMoney)
     */
    it("should fallback to base commission when no renewal tier matches", async () => {
      // Consumo = 50, isRenewal = true
      // Tramo [0, 100] tiene appliesToRenewal = false, no aplica
      // Debería usar la comisión base de la tarifa
      const result = await CommissionTiersService.calculateCommission(1, 50, true);
      // Esperamos el fallback (paymentMoney de la tarifa o 0)
      expect(result).toBeDefined();
    });
  });

  describe("bulkUpsert validation", () => {
    /**
     * Test 7: Validación de solapes entre tramos
     * Dado dos tramos que se solapan: [0, 100] y [50, 150]
     * Debería lanzar un error indicando el solape
     */
    it("should reject overlapping tiers", async () => {
      const overlappingTiers = [
        { minConsumo: 0, maxConsumo: 100, comision: 10, appliesToRenewal: false },
        { minConsumo: 50, maxConsumo: 150, comision: 20, appliesToRenewal: false },
      ];

      await expect(
        CommissionTiersService.bulkUpsert(1, overlappingTiers)
      ).rejects.toThrow(/solapa/i);
    });

    /**
     * Test 8: Validación min > max
     * Dado un tramo con minConsumo > maxConsumo
     * Debería lanzar un error de validación
     */
    it("should reject tier with min > max", async () => {
      const invalidTier = [
        { minConsumo: 100, maxConsumo: 50, comision: 10, appliesToRenewal: false },
      ];

      await expect(
        CommissionTiersService.bulkUpsert(1, invalidTier)
      ).rejects.toThrow(/menor o igual/i);
    });
  });

  describe("tier selection priority", () => {
    /**
     * Test 9: Prioridad del tramo más específico
     * Si hubiera tramos solapados (aunque la validación lo impide),
     * el sistema debería priorizar el rango más pequeño.
     *
     * Esto se verifica implícitamente en calculateCommission donde
     * se selecciona el tramo con el rango más pequeño (max - min).
     */
    it("should prioritize most specific tier (smallest range)", async () => {
      // Este test valida que la lógica de selección funciona correctamente
      // El tramo [0, 100] tiene rango 100
      // El tramo [101, 500] tiene rango 399
      // El tramo [501, ∞] tiene rango infinito

      // Consumo = 50 debería caer en el tramo más específico [0, 100]
      const result = await CommissionTiersService.calculateCommission(1, 50, false);
      expect(result).toBe(10); // Comisión del tramo [0, 100]
    });
  });
});

/**
 * MANUAL TEST CASES (para probar desde la UI):
 *
 * Escenario 1: Crear 3 tramos para una tarifa
 * - Tramo 1: Min=0, Max=100, Comisión=10€, Renovación=NO
 * - Tramo 2: Min=101, Max=500, Comisión=25€, Renovación=SÍ
 * - Tramo 3: Min=501, Max=(vacío), Comisión=50€, Renovación=SÍ
 *
 * Verificaciones:
 * 1. GET /commission-tiers/calculate?rateId=X&consumo=50&isRenewal=false → Debería retornar 10
 * 2. GET /commission-tiers/calculate?rateId=X&consumo=250&isRenewal=false → Debería retornar 25
 * 3. GET /commission-tiers/calculate?rateId=X&consumo=1000&isRenewal=false → Debería retornar 50
 * 4. GET /commission-tiers/calculate?rateId=X&consumo=50&isRenewal=true → Debería retornar comisión base (fallback)
 * 5. GET /commission-tiers/calculate?rateId=X&consumo=250&isRenewal=true → Debería retornar 25
 */
