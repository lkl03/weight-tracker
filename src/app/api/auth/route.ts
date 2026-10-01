import { NextRequest, NextResponse } from "next/server";
import { checkPassword, COOKIE_MAX_AGE, COOKIE_NAME, signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (!(await checkPassword(password))) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
