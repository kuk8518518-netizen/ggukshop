import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "로그아웃 성공" });
  res.cookies.set("token", "", { maxAge: 0, path: "/" });
  return res;
}
