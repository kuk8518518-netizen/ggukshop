import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const db = await initDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let result;
  if (category) {
    result = await db.execute({ sql: "SELECT * FROM products WHERE category = ? ORDER BY created_at DESC", args: [category] });
  } else if (search) {
    result = await db.execute({ sql: "SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC", args: [`%${search}%`] });
  } else {
    result = await db.execute("SELECT * FROM products ORDER BY created_at DESC");
  }

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name, description, price, image, category, stock } = await req.json();
  const result = await db.execute({
    sql: "INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)",
    args: [name, description || "", price, image || "", category || "", stock || 0],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "상품 등록 완료" });
}
