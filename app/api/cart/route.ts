import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const result = await db.execute({
    sql: `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image
          FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`,
    args: [user.id],
  });
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { productId, quantity } = await req.json();

  const product = await db.execute({ sql: "SELECT stock FROM products WHERE id = ?", args: [productId] });
  const stock = (product.rows[0] as any)?.stock || 0;

  const existing = await db.execute({
    sql: "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
    args: [user.id, productId],
  });

  const currentQty = existing.rows.length > 0 ? (existing.rows[0] as any).quantity : 0;
  const newQty = currentQty + (quantity || 1);

  if (newQty > stock) {
    return NextResponse.json({ error: `재고가 ${stock}개 남았습니다.` }, { status: 400 });
  }

  if (existing.rows.length > 0) {
    const row = existing.rows[0] as any;
    await db.execute({ sql: "UPDATE cart_items SET quantity = ? WHERE id = ?", args: [newQty, row.id] });
  } else {
    await db.execute({ sql: "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", args: [user.id, productId, quantity || 1] });
  }
  return NextResponse.json({ message: "장바구니에 추가되었습니다." });
}

export async function DELETE(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { itemId } = await req.json();
  await db.execute({ sql: "DELETE FROM cart_items WHERE id = ? AND user_id = ?", args: [itemId, user.id] });
  return NextResponse.json({ message: "삭제되었습니다." });
}
