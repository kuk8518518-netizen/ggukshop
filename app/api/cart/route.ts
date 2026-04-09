import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const items = db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(user.id);

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { productId, quantity } = await req.json();

  const existing = db.prepare(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
  ).get(user.id, productId) as any;

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(existing.quantity + (quantity || 1), existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)").run(user.id, productId, quantity || 1);
  }

  return NextResponse.json({ message: "장바구니에 추가되었습니다." });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { itemId } = await req.json();
  db.prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(itemId, user.id);
  return NextResponse.json({ message: "삭제되었습니다." });
}
