import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHolidayFields1766142387791 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add uuid column
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`uuid\` varchar(36) NOT NULL`
    );

    // Generate UUIDs for existing rows
    await queryRunner.query(
      `UPDATE \`holidays\` SET \`uuid\` = UUID() WHERE \`uuid\` = '' OR \`uuid\` IS NULL`
    );

    // Add unique constraint to uuid
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD UNIQUE INDEX \`IDX_holidays_uuid\` (\`uuid\`)`
    );

    // Add scope column
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`scope\` varchar(20) NOT NULL DEFAULT 'global'`
    );

    // Add userId column (nullable)
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`userId\` int NULL`
    );

    // Add groupId column (nullable)
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`groupId\` int NULL`
    );

    // Add createdAt column
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );

    // Add updatedAt column
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );

    // Add foreign key for userId
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD CONSTRAINT \`FK_holidays_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // Add foreign key for groupId
    await queryRunner.query(
      `ALTER TABLE \`holidays\` ADD CONSTRAINT \`FK_holidays_group\` FOREIGN KEY (\`groupId\`) REFERENCES \`group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP FOREIGN KEY \`FK_holidays_group\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP FOREIGN KEY \`FK_holidays_user\``
    );

    // Remove columns
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`updatedAt\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`createdAt\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`groupId\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`userId\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`scope\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP INDEX \`IDX_holidays_uuid\``
    );
    await queryRunner.query(
      `ALTER TABLE \`holidays\` DROP COLUMN \`uuid\``
    );
  }
}
