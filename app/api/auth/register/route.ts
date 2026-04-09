import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await initDB();
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
  }

  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] });
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 400 });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = await db.execute({ sql: "INSERT INTO users (email, password, name) VALUES (?, ?, ?)", args: [email, hashed, name] });

  const token = signToken({
    id: Number(result.lastInsertRowid),
    email,
    name,
    role: "user",
  });

  const res = NextResponse.json({ message: "회원가입 성공" });
  res.cookies.set("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}
