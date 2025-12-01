import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const useSQLite = process.env.DB_TYPE === "sqlite" || (!isProduction && !process.env.DB_HOST);

export const dataSource = useSQLite
  ? new DataSource({
      type: "better-sqlite3",
      database: "spikes.db",
      entities: isProduction
        ? ["dist/src/models/*.entity.js"]
        : [__dirname + "/src/models/*.entity.ts"],
      logging: false,
      synchronize: true,
      migrations: ["dist/src/migrations/**/*{.ts,.js}"],
      migrationsTableName: "migration",
    })
  : new DataSource({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "spikes",
      entities: isProduction
        ? ["dist/src/models/*.entity.js"]
        : [__dirname + "/src/models/*.entity.ts"],
      logging: false,
      synchronize: true,
      migrations: ["dist/src/migrations/**/*{.ts,.js}"],
      migrationsTableName: "migration",
      charset: "utf8mb4",
    });
