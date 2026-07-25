import { NextResponse } from "next/server";
import { clearReceptionSession } from "@/lib/auth/receptionSession";

export async function POST() {
  clearReceptionSession();
  return NextResponse.json({ ok: true });
}
