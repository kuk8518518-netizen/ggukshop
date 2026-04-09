import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const data = db.prepare("SELECT name, phone, zipcode, address, address_detail FROM users WHERE id = ?").get(user.id) as any;
  return NextResponse.json(data || {});
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { phone, zipcode, address, addressDetail } = await req.json();
  db.prepare("UPDATE users SET phone = ?, zipcode = ?, address = ?, address_detail = ? WHERE id = ?")
    .run(phone || "", zipcode || "", address || "", addressDetail || "", user.id);

  return NextResponse.json({ message: "주소가 저장되었습니다." });
}
