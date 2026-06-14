/**
 * Create (or update) a dsec-app login.
 *
 *   npx tsx scripts/create-user.ts <email> <password> [name]
 *
 * Hashes the password with bcrypt and upserts into the `app_user` table.
 * dotenv is loaded first, and the db module is imported dynamically afterward,
 * so DATABASE_URL is set before the connection pool is created.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password> [name]");
    process.exit(1);
  }

  const bcrypt = (await import("bcryptjs")).default;
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { appUser } = await import("../src/db/schema");

  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await db
    .select()
    .from(appUser)
    .where(eq(appUser.email, normalizedEmail))
    .limit(1);

  if (existing) {
    await db
      .update(appUser)
      .set({ passwordHash, name: name ?? existing.name, isActive: true })
      .where(eq(appUser.id, existing.id));
    console.log(`Updated user: ${normalizedEmail}`);
  } else {
    await db.insert(appUser).values({
      email: normalizedEmail,
      name: name ?? null,
      passwordHash,
      role: "exec",
      isActive: true,
    });
    console.log(`Created user: ${normalizedEmail}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
