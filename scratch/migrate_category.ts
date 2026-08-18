import { db } from "../lib/db";

async function main() {
  console.log("Migrando columna category en PostgreSQL Supabase...");
  await db.$executeRawUnsafe(`ALTER TABLE products ALTER COLUMN category TYPE varchar(100) USING category::text;`);
  console.log("¡Migración exitosa!");
}

main().catch(err => {
  console.error("Error en migración:", err);
}).finally(() => process.exit(0));
