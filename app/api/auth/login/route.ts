import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await initDB();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 });
  }

  const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  const user = result.rows[0] as any;
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });

  const res = NextResponse.json({ message: "로그인 성공", user: { id: user.id, name: user.name, role: user.role } });
  res.cookies.set("token", token, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return res;
}
