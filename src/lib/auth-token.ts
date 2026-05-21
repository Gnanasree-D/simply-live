import "server-only";
import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const EXPIRY = "30d";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

export interface AuthToken {
  userId: string;
  email: string;
}

export async function signAuthToken(payload: AuthToken): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifyAuthToken(token: string): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** Extract bearer token from "Authorization: Bearer <jwt>". */
export function readBearer(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function requireAuth(
  req: Request,
): Promise<AuthToken | { error: Response }> {
  const token = readBearer(req.headers.get("authorization"));
  if (!token) {
    return {
      error: new Response("Unauthorized", { status: 401 }),
    };
  }
  const auth = await verifyAuthToken(token);
  if (!auth) {
    return {
      error: new Response("Unauthorized", { status: 401 }),
    };
  }
  return auth;
}
