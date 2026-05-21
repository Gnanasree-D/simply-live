import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signAuthToken } from "@/lib/auth-token";
import { genId } from "@/lib/server-id";

const Body = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function randomBase64(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64");
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Invalid input"
        : "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  // Generate per-user salts.
  // - kdfSalt: client uses this with PBKDF2 to derive the encryption key.
  // - recoverySalt: same role, but for the recovery-key flow.
  const kdfSalt = randomBase64(16);
  const recoverySalt = randomBase64(16);

  // The recovery key is a 32-char base32-ish string the user must save once.
  // We only store its bcrypt hash, never the plaintext.
  const recoveryKey = randomBase64(20).replace(/[+/=]/g, "").slice(0, 24);

  const [passwordHash, recoveryHash] = await Promise.all([
    bcrypt.hash(parsed.password, 12),
    bcrypt.hash(recoveryKey, 10),
  ]);

  const user = await db.user.create({
    data: {
      id: genId(),
      email: parsed.email,
      passwordHash,
      kdfSalt,
      recoveryHash,
      recoverySalt,
    },
    select: { id: true, email: true, kdfSalt: true, recoverySalt: true },
  });

  const token = await signAuthToken({ userId: user.id, email: user.email });

  return NextResponse.json({
    token,
    email: user.email,
    kdfSalt: user.kdfSalt,
    recoverySalt: user.recoverySalt,
    recoveryKey, // SHOWN ONCE — client surfaces this and never lets the user see it again
  });
}
