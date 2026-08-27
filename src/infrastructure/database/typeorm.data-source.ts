import { DataSource } from "typeorm";
import { join } from "path";
import { validateEnvironment } from "../../config/env.validation";

const environment = validateEnvironment(process.env);

export default new DataSource({
  type: "postgres",
  url: environment.DATABASE_URL,
  entities: [
    join(
      __dirname,
      "../../modules/**/infrastructure/persistence/*{.orm-entity.ts,.orm-entity.js,.entity.ts,.entity.js}",
    ),
  ],
  migrations: [join(__dirname, "migrations/*{.ts,.js}")],
  synchronize: false,
});
