import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const DATA_DIR = ".pglite";
const PORT = Number(process.env.PGLITE_PORT ?? 55432);

mkdirSync(DATA_DIR, { recursive: true });

const db = await PGlite.create({ dataDir: DATA_DIR });
await db.waitReady;

const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1" });
await server.start();

console.log(`Embedded Postgres listening on postgresql://postgres@127.0.0.1:${PORT}/postgres`);
console.log(`DATABASE_URL="postgresql://postgres@127.0.0.1:${PORT}/postgres"`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
