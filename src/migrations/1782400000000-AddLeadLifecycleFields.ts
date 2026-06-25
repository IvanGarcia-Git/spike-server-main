import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddLeadLifecycleFields1782400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Añadir campos a la tabla `lead` para el ciclo de vida y rotación
    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "status",
        type: "varchar",
        length: "50",
        default: "'activo'",
        comment: "Estado del lead en el ciclo de vida: activo/muerto/callback",
      })
    );

    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "attempt_count",
        type: "int",
        default: 0,
        comment: "Número de intentos de llamada realizados",
      })
    );

    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "next_call_date",
        type: "datetime",
        isNullable: true,
        comment: "Fecha/hora programada para la próxima llamada (callback)",
      })
    );

    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "agent_rotation_history",
        type: "json",
        isNullable: true,
        comment: "Historial de agentes que han intentado este lead [userId, timestamp][]",
      })
    );

    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "whatsapp_number",
        type: "varchar",
        length: "20",
        isNullable: true,
        comment: "Número de WhatsApp (obligatorio desde intento 6)",
      })
    );

    await queryRunner.addColumn(
      "lead",
      new TableColumn({
        name: "is_permanently_assigned",
        type: "boolean",
        default: false,
        comment: "True cuando el lead está bloqueado definitivamente a un agente (tras intento 6)",
      })
    );

    // 2. Crear tabla `tipification` para el sistema de tipificaciones
    await queryRunner.createTable(
      new Table({
        name: "tipification",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
          },
          {
            name: "category",
            type: "varchar",
            length: "50",
            comment: "categoria: contacto/no_contacto/descarte",
          },
          {
            name: "action",
            type: "varchar",
            length: "50",
            comment: "accion_sistema: cerrar/reintento/callback/ventas/seguimiento",
          },
          {
            name: "retry_hours",
            type: "int",
            isNullable: true,
            comment: "Horas de espera para reintento (null si no aplica)",
          },
          {
            name: "requires_whatsapp",
            type: "boolean",
            default: false,
          },
          {
            name: "is_active",
            type: "boolean",
            default: true,
          },
          {
            name: "created_at",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // 3. Crear tabla `lead_tipification_history` para registrar histórico
    await queryRunner.createTable(
      new Table({
        name: "lead_tipification_history",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "lead_id",
            type: "int",
          },
          {
            name: "tipification_id",
            type: "int",
          },
          {
            name: "user_id",
            type: "int",
            comment: "Agente que tipificó",
          },
          {
            name: "observation",
            type: "text",
            isNullable: true,
          },
          {
            name: "attempt_count_at_tipification",
            type: "int",
            comment: "Número de intentos en el momento de tipificar",
          },
          {
            name: "created_at",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // 4. Crear foreign keys para lead_tipification_history
    await queryRunner.createForeignKey(
      "lead_tipification_history",
      new TableForeignKey({
        name: "FK_lead_tipification_lead",
        columnNames: ["lead_id"],
        referencedTableName: "lead",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "lead_tipification_history",
      new TableForeignKey({
        name: "FK_lead_tipification_tipification",
        columnNames: ["tipification_id"],
        referencedTableName: "tipification",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    await queryRunner.createForeignKey(
      "lead_tipification_history",
      new TableForeignKey({
        name: "FK_lead_tipification_user",
        columnNames: ["user_id"],
        referencedTableName: "user",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      })
    );

    // 5. Añadir índice para búsquedas por status y next_call_date
    await queryRunner.createIndex(
      "lead",
      new TableColumn({
        name: "idx_lead_status_next_call",
        type: "index",
        columnNames: ["status", "next_call_date"],
      })
    );

    // 6. Insertar tipificaciones por defecto
    await queryRunner.query(`
      INSERT INTO tipification (name, category, action, retry_hours, requires_whatsapp) VALUES
      -- CONTACTO EFECTIVO
      ('Interesado', 'contacto', 'ventas', NULL, false),
      ('No interesado', 'contacto', 'cerrar', NULL, false),
      ('Ya es cliente', 'contacto', 'cerrar', NULL, false),
      ('Volver a llamar', 'contacto', 'callback', NULL, false),
      ('No es el momento', 'contacto', 'reintento', 168, false),
      ('Pide información', 'contacto', 'seguimiento', NULL, false),
      ('Interesado pero ocupado', 'contacto', 'reintento', 2, false),
      ('Cita agendada', 'contacto', 'agenda', NULL, false),
      -- NO CONTACTO
      ('No contesta', 'no_contacto', 'reintento', NULL, false),
      ('Ocupado', 'no_contacto', 'reintento', NULL, false),
      ('Apagado / fuera de cobertura', 'no_contacto', 'reintento', NULL, false),
      ('Cuelga llamada', 'no_contacto', 'reintento', NULL, false),
      ('Salta buzón de voz', 'no_contacto', 'reintento', NULL, false),
      ('Teléfono no disponible temporalmente', 'no_contacto', 'reintento', NULL, false),
      -- DESCARTE
      ('Número incorrecto', 'descarte', 'cerrar', NULL, false),
      ('No existe', 'descarte', 'cerrar', NULL, false),
      ('Datos falsos', 'descarte', 'cerrar', NULL, false),
      ('No llamar', 'descarte', 'cerrar', NULL, false),
      ('Spam / lead basura', 'descarte', 'cerrar', NULL, false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices y foreign keys primero
    await queryRunner.dropIndex("lead", "idx_lead_status_next_call");
    
    await queryRunner.dropForeignKey("lead_tipification_history", "FK_lead_tipification_user");
    await queryRunner.dropForeignKey("lead_tipification_history", "FK_lead_tipification_tipification");
    await queryRunner.dropForeignKey("lead_tipification_history", "FK_lead_tipification_lead");

    // Eliminar tablas
    await queryRunner.dropTable("lead_tipification_history");
    await queryRunner.dropTable("tipification");

    // Eliminar columnas de lead
    await queryRunner.dropColumn("lead", "is_permanently_assigned");
    await queryRunner.dropColumn("lead", "whatsapp_number");
    await queryRunner.dropColumn("lead", "agent_rotation_history");
    await queryRunner.dropColumn("lead", "next_call_date");
    await queryRunner.dropColumn("lead", "attempt_count");
    await queryRunner.dropColumn("lead", "status");
  }
}
