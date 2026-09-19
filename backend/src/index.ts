import path from "path";
import { createApp } from "./app";
import { createPool, migrate } from "./db";
import { PostgresPersonRepository } from "./person/postgresRepository";

const PORT = Number(process.env.PORT ?? 8080);
const STATIC_DIR = process.env.STATIC_DIR ?? path.join(__dirname, "public");

async function main(): Promise<void> {
  const pool = createPool();
  await migrate(pool);

  const app = createApp(new PostgresPersonRepository(pool), { staticDir: STATIC_DIR });
  const server = app.listen(PORT, () => console.log(`person-service listening on port ${PORT}`));

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down`);
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Failed to start person-service", error);
  process.exit(1);
});
