import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let orders;
  if (user.role === "admin") {
    orders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();
  } else {
    orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
  }

  const ordersWithItems = (orders as any[]).map((order: any) => {
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  return NextResponse.json(ordersWithItems);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { receiverName, phone, zipcode, address, addressDetail, paymentMethod } = await req.json();

  if (!receiverName || !phone || !address) {
    return NextResponse.json({ error: "수령인, 연락처, 주소는 필수입니다." }, { status: 400 });
  }

  const cartItems = db.prepare(`
    SELECT ci.*, p.price, p.stock FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(user.id) as any[];

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "장바구니가 비어있습니다." }, { status: 400 });
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const insertOrder = db.transaction(() => {
    const order = db.prepare(
      "INSERT INTO orders (user_id, total, receiver_name, phone, zipcode, address, address_detail, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(user.id, total, receiverName, phone, zipcode || "", address, addressDetail || "", paymentMethod || "card");
    const orderId = order.lastInsertRowid;

    for (const item of cartItems) {
      db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)").run(
        orderId, item.product_id, item.quantity, item.price
      );
      db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.product_id);
    }

    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(user.id);
    return orderId;
  });

  const orderId = insertOrder();
  return NextResponse.json({ message: "주문이 완료되었습니다.", orderId });
}
