import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPowerChangeField1765791515964 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer\` ADD \`powerChange\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`lead_sheet\` ADD \`powerChange\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`lead_sheet\` DROP COLUMN \`powerChange\``);
        await queryRunner.query(`ALTER TABLE \`customer\` DROP COLUMN \`powerChange\``);
    }

}
