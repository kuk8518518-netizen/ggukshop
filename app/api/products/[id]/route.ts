import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDB();
  const { id } = await params;
  const result = await db.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [id] });
  if (result.rows.length === 0) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const { name, description, price, image, category, stock } = await req.json();
  await db.execute({
    sql: "UPDATE products SET name=?, description=?, price=?, image=?, category=?, stock=? WHERE id=?",
    args: [name, description, price, image, category, stock, id],
  });
  return NextResponse.json({ message: "상품 수정 완료" });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "상품 삭제 완료" });
}
