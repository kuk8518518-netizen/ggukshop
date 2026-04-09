import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const result = await db.execute({
    sql: "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    args: [user.id],
  });
  return NextResponse.json(result.rows);
}

export async function PUT(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await req.json();
  if (id === "all") {
    await db.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE user_id = ?", args: [user.id] });
  } else {
    await db.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", args: [id, user.id] });
  }
  return NextResponse.json({ message: "읽음 처리 완료" });
}
