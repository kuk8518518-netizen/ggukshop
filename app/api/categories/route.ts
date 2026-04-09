import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const categories = db.prepare("SELECT * FROM categories ORDER BY id").all();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "카테고리명을 입력해주세요." }, { status: 400 });
  }

  try {
    db.prepare("INSERT INTO categories (name) VALUES (?)").run(name.trim());
    return NextResponse.json({ message: "카테고리 추가 완료" });
  } catch {
    return NextResponse.json({ error: "이미 존재하는 카테고리입니다." }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id, name } = await req.json();
  const old = db.prepare("SELECT name FROM categories WHERE id = ?").get(id) as any;
  db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name.trim(), id);
  if (old) {
    db.prepare("UPDATE products SET category = ? WHERE category = ?").run(name.trim(), old.name);
  }
  return NextResponse.json({ message: "카테고리 수정 완료" });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await req.json();
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return NextResponse.json({ message: "카테고리 삭제 완료" });
}
