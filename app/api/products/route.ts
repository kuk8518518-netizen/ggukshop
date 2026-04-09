import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  let query = "SELECT * FROM products";
  const params: any[] = [];

  if (category) {
    query += " WHERE category = ?";
    params.push(category);
  } else if (search) {
    query += " WHERE name LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";
  const products = db.prepare(query).all(...params);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { name, description, price, image, category, stock } = await req.json();
  const result = db.prepare(
    "INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(name, description || "", price, image || "", category || "", stock || 0);

  return NextResponse.json({ id: result.lastInsertRowid, message: "상품 등록 완료" });
}
