import { Pool, PoolConfig } from "pg";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS persons
(
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL,
    age     INT,
    address VARCHAR(255),
    work    VARCHAR(255)
);
`;

/**
 * Heroku Postgres exposes DATABASE_URL and requires TLS with a self-signed
 * certificate chain, so verification is disabled for that case only.
 */
export function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  const config: PoolConfig = connectionString
    ? {
        connectionString,
        ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false }
      }
    : {
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        database: process.env.POSTGRES_DB ?? "persons",
        user: process.env.POSTGRES_USER ?? "program",
        password: process.env.POSTGRES_PASSWORD ?? "test"
      };

  return new Pool({ ...config, max: Number(process.env.POSTGRES_POOL_SIZE ?? 5) });
}

export async function migrate(pool: Pool): Promise<void> {
  await pool.query(SCHEMA);
}
