import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return NextResponse.json({ message: "주문 상태가 변경되었습니다." });
}
