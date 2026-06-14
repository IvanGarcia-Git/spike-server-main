import { MigrationInterface, QueryRunner } from "typeorm";
import { zonaFromPostalCode } from "../helpers/spanish-provinces.helper";

/**
 * PRES-018 B2a — Rellena lead.zona de los leads existentes a partir del código
 * postal de su ficha (lead_sheet.zipCode). Solo toca leads sin zona previa.
 */
export class BackfillLeadZonaFromPostalCode1770000001000 implements MigrationInterface {
    name = 'BackfillLeadZonaFromPostalCode1770000001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const rows: { leadId: number; zipCode: string }[] = await queryRunner.query(
            "SELECT `leadId`, `zipCode` FROM `lead_sheet` " +
            "WHERE `leadId` IS NOT NULL AND `zipCode` IS NOT NULL AND `zipCode` <> ''"
        );

        for (const row of rows) {
            const zona = zonaFromPostalCode(row.zipCode);
            if (!zona) continue;
            await queryRunner.query(
                "UPDATE `lead` SET `zona` = ? WHERE `id` = ? AND (`zona` IS NULL OR `zona` = '')",
                [zona, row.leadId]
            );
        }
    }

    public async down(): Promise<void> {
        // Backfill de datos; no se revierte (la columna se elimina en AddZonaToLead.down).
    }
}
