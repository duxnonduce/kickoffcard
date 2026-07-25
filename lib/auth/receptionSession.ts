import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ko_reception_session";
const secret = () => new TextEncoder().encode(process.env.RECEPTION_SESSION_SECRET!);

export type ReceptionSession = {
  receptionistId: string;
  fullName: string;
};

// Crea il JWT di sessione dopo login con PIN e lo scrive in un cookie httpOnly.
export async function createReceptionSession(session: ReceptionSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h") // fine turno
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

// Legge e valida la sessione reception dalla richiesta corrente.
// Ritorna null se assente/scaduta: le route la trattano come "non autorizzato".
export async function getReceptionSession(): Promise<ReceptionSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as ReceptionSession;
  } catch {
    return null;
  }
}

export function clearReceptionSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
