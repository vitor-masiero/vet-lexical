import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não está definida no ambiente.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.uid;
    return typeof uid === "string" ? uid : null;
  } catch {
    return null;
  }
}

/** Retorna o id do usuário logado, ou null. Memoizado por request. */
export const getSession = cache(async (): Promise<string | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
});

/** Usa em Server Components: redireciona para /login se não autenticado. */
export async function requireUser(): Promise<string> {
  const userId = await getSession();
  if (!userId) redirect("/login");
  return userId;
}

/** Usa em Route Handlers: retorna null se não autenticado (sem redirecionar). */
export async function getUserId(): Promise<string | null> {
  return getSession();
}

/** Define o cookie de sessão (apenas em Route Handlers / Server Actions). */
export async function setSessionCookie(userId: string): Promise<void> {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Remove o cookie de sessão (apenas em Route Handlers / Server Actions). */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
