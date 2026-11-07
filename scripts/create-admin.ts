import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "dotenv";
import { hash } from "@node-rs/argon2";
import { withClient } from "./db-utils";

config({ path: ".env.local" });

const ARGON_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

function validatePassword(password: string) {
  const errors: string[] = [];
  if (password.length < 12) errors.push("at least 12 characters");
  if (!/\d/.test(password)) errors.push("one number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("one symbol");
  return errors;
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const emailFlag = process.argv.find((arg) => arg.startsWith("--email="));
  const nameFlag = process.argv.find((arg) => arg.startsWith("--name="));
  const passwordFlag = process.argv.find((arg) => arg.startsWith("--password="));

  const email = (emailFlag?.split("=")[1] ?? (await rl.question("Admin email: ")))
    .trim()
    .toLowerCase();
  const name = nameFlag?.split("=")[1] ?? (await rl.question("Admin name: "));
  const password =
    passwordFlag?.split("=")[1] ??
    process.env.ADMIN_PASSWORD ??
    (await rl.question("Admin password (min 12 chars): "));

  const problems = validatePassword(password);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.unshift("valid email");
  if (problems.length > 0) {
    console.error(`Invalid input. Password needs: ${problems.join(", ")}.`);
    rl.close();
    process.exit(1);
  }

  const passwordHash = await hash(password, ARGON_OPTIONS);

  await withClient(async (db) => {
    const roleRows = await db.query(`select id from admin_roles where key = 'owner' limit 1`);
    const roleId = roleRows[0]?.id as string | undefined;
    if (!roleId) {
      throw new Error("Owner role missing. Run npm run db:seed first.");
    }

    const existing = await db.query(`select id from admins where lower(email) = $1 limit 1`, [
      email,
    ]);

    if (existing[0]) {
      await db.query(
        `update admins set password_hash = $2, name = $3, is_active = true,
           failed_attempts = 0, locked_until = null, password_changed_at = now(), updated_at = now()
         where id = $1`,
        [existing[0].id, passwordHash, name],
      );
      await db.query(`update admin_sessions set revoked_at = now() where admin_id = $1`, [
        existing[0].id,
      ]);
      console.log(`Updated password for existing admin ${email}.`);
      return;
    }

    await db.query(
      `insert into admins (email, name, password_hash, role_id, password_changed_at)
       values ($1, $2, $3, $4, now())`,
      [email, name, passwordHash, roleId],
    );
    console.log(`Created admin ${email}.`);
  });

  rl.close();
  console.log("Store the password in a manager. It is not recoverable from the database.");
}

main().catch((error) => {
  console.error("Admin setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
