import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const email = process.env.SEED_USER_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_USER_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  if (!email || !password || !connectionString) {
    throw new Error(
      "Missing SEED_USER_EMAIL, SEED_USER_PASSWORD, or DATABASE_URL in .env.local",
    );
  }
  if (password === "choose-a-strong-password" || email === "you@example.com") {
    console.warn(
      "⚠ Using placeholder seed credentials — update .env.local before deploying.",
    );
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  // Single-user invariant: drop any user that isn't the configured one.
  const dropped = await db.user.deleteMany({ where: { email: { not: email } } });
  if (dropped.count > 0) console.log(`✓ Removed ${dropped.count} stale user(s)`);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { hashedPassword },
    create: { email, hashedPassword },
  });

  console.log(`✓ Seeded user ${user.email} (id: ${user.id})`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
