import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddZonaToLead1770000000000 implements MigrationInterface {
    name = 'AddZonaToLead1770000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // PRES-018 B2a: zona geográfica del lead para el motor de asignación automática
        await queryRunner.addColumn("lead", new TableColumn({
            name: "zona",
            type: "varchar",
            length: "100",
            isNullable: true,
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("lead", "zona");
    }
}
