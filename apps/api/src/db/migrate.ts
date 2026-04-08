import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  console.log("Running migrations...");
  for (const file of files) {
    console.log(`  → ${file}`);
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await db.query(sql);
  }
  console.log("Migrations complete.");
}

async function seed() {
  const sql = readFileSync(
    join(__dirname, "seeds", "bots.sql"),
    "utf8"
  );
  console.log("Running seeds...");
  await db.query(sql);
  console.log("Seed complete.");
}

const command = process.argv[2];

if (command === "seed") {
  seed().then(() => db.end()).catch((e) => { console.error(e); process.exit(1); });
} else {
  migrate().then(() => db.end()).catch((e) => { console.error(e); process.exit(1); });
}
