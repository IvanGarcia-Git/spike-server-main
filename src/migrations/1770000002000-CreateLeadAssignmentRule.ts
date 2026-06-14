import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * PRES-018 B2a — Tabla de reglas de asignación automática de leads.
 */
export class CreateLeadAssignmentRule1770000002000 implements MigrationInterface {
    name = 'CreateLeadAssignmentRule1770000002000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "lead_assignment_rule",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "uuid", type: "varchar", length: "36", isNullable: false },
                    { name: "name", type: "varchar", length: "150", isNullable: false },
                    { name: "active", type: "tinyint", default: 1, isNullable: false },
                    { name: "priority", type: "int", default: 100, isNullable: false },
                    { name: "zona", type: "varchar", length: "100", isNullable: true },
                    { name: "sector", type: "varchar", length: "50", isNullable: true },
                    { name: "origin", type: "varchar", length: "255", isNullable: true },
                    { name: "campaignId", type: "int", isNullable: true },
                    { name: "shift", type: "varchar", length: "20", isNullable: true },
                    { name: "assignMode", type: "varchar", length: "20", default: "'least_busy'", isNullable: false },
                    { name: "targetUserId", type: "int", isNullable: true },
                    { name: "targetGroupId", type: "int", isNullable: true },
                    { name: "roundRobinCursor", type: "int", default: 0, isNullable: false },
                    { name: "createdAt", type: "datetime(6)", default: "CURRENT_TIMESTAMP(6)", isNullable: false },
                    { name: "updatedAt", type: "datetime(6)", default: "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)", isNullable: false },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("lead_assignment_rule", true);
    }
}
