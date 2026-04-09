import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const db = await initDB();
  const result = await db.execute("SELECT * FROM categories ORDER BY id");
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { name } = await req.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "카테고리명을 입력해주세요." }, { status: 400 });

  try {
    await db.execute({ sql: "INSERT INTO categories (name) VALUES (?)", args: [name.trim()] });
    return NextResponse.json({ message: "카테고리 추가 완료" });
  } catch {
    return NextResponse.json({ error: "이미 존재하는 카테고리입니다." }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id, name } = await req.json();
  const old = await db.execute({ sql: "SELECT name FROM categories WHERE id = ?", args: [id] });
  await db.execute({ sql: "UPDATE categories SET name = ? WHERE id = ?", args: [name.trim(), id] });
  if (old.rows.length > 0) {
    await db.execute({ sql: "UPDATE products SET category = ? WHERE category = ?", args: [name.trim(), (old.rows[0] as any).name] });
  }
  return NextResponse.json({ message: "카테고리 수정 완료" });
}

export async function DELETE(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await req.json();
  await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "카테고리 삭제 완료" });
}
