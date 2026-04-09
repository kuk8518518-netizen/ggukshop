import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const { name, description, price, image, category, stock } = await req.json();
  db.prepare(
    "UPDATE products SET name=?, description=?, price=?, image=?, category=?, stock=? WHERE id=?"
  ).run(name, description, price, image, category, stock, id);

  return NextResponse.json({ message: "상품 수정 완료" });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return NextResponse.json({ message: "상품 삭제 완료" });
}
