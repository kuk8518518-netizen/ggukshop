import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const result = await db.execute({ sql: "SELECT name, phone, zipcode, address, address_detail FROM users WHERE id = ?", args: [user.id] });
  return NextResponse.json(result.rows[0] || {});
}

export async function PUT(req: NextRequest) {
  await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { phone, zipcode, address, addressDetail } = await req.json();
  await db.execute({
    sql: "UPDATE users SET phone = ?, zipcode = ?, address = ?, address_detail = ? WHERE id = ?",
    args: [phone || "", zipcode || "", address || "", addressDetail || "", user.id],
  });
  return NextResponse.json({ message: "주소가 저장되었습니다." });
}
