"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { deriveKey, exportKey, importKey } from "@/lib/crypto";

const TOKEN_KEY = "simplylive.session.token";
const EMAIL_KEY = "simplylive.session.email";
const KDF_SALT_KEY = "simplylive.session.kdfSalt";
const RAW_KEY_KEY = "simplylive.session.rawKey";

export interface Session {
  token: string;
  email: string;
  kdfSalt: string;
  key: CryptoKey;
}

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
  ) => Promise<{ recoveryKey: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Fail fast instead of hanging if the server can't reach the database.
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error(
        "The server took too long to respond — it may be unable to reach the database. Please try again.",
      );
    }
    throw new Error("Network error — please check your connection and try again.");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // Restore session from localStorage on mount.
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const email = localStorage.getItem(EMAIL_KEY);
        const kdfSalt = localStorage.getItem(KDF_SALT_KEY);
        const rawKey = localStorage.getItem(RAW_KEY_KEY);
        if (token && email && kdfSalt && rawKey) {
          const key = await importKey(rawKey);
          setSession({ token, email, kdfSalt, key });
        }
      } catch {
        // Corrupt session storage — wipe and continue logged-out.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem(KDF_SALT_KEY);
        localStorage.removeItem(RAW_KEY_KEY);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (s: Session) => {
    localStorage.setItem(TOKEN_KEY, s.token);
    localStorage.setItem(EMAIL_KEY, s.email);
    localStorage.setItem(KDF_SALT_KEY, s.kdfSalt);
    localStorage.setItem(RAW_KEY_KEY, await exportKey(s.key));
    setSession(s);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await postJson<{
        token: string;
        email: string;
        kdfSalt: string;
      }>("/api/auth/login", { email, password });
      const key = await deriveKey(password, res.kdfSalt);
      await persist({ token: res.token, email: res.email, kdfSalt: res.kdfSalt, key });
    },
    [persist],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const res = await postJson<{
        token: string;
        email: string;
        kdfSalt: string;
        recoveryKey: string;
      }>("/api/auth/signup", { email, password });
      const key = await deriveKey(password, res.kdfSalt);
      await persist({ token: res.token, email: res.email, kdfSalt: res.kdfSalt, key });
      return { recoveryKey: res.recoveryKey };
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(KDF_SALT_KEY);
    localStorage.removeItem(RAW_KEY_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
