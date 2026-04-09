import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  let orders;
  if (user.role === "admin") {
    orders = await db.execute("SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC");
  } else {
    orders = await db.execute({ sql: "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", args: [user.id] });
  }

  const ordersWithItems = [];
  for (const order of orders.rows as any[]) {
    const items = await db.execute({
      sql: "SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
      args: [order.id],
    });
    ordersWithItems.push({ ...order, items: items.rows });
  }
  return NextResponse.json(ordersWithItems);
}

export async function POST(req: NextRequest) {
  const db = await initDB();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { receiverName, phone, zipcode, address, addressDetail, paymentMethod } = await req.json();
  if (!receiverName || !phone || !address) {
    return NextResponse.json({ error: "수령인, 연락처, 주소는 필수입니다." }, { status: 400 });
  }

  const cartResult = await db.execute({
    sql: "SELECT ci.*, p.price, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?",
    args: [user.id],
  });
  const cartItems = cartResult.rows as any[];

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "장바구니가 비어있습니다." }, { status: 400 });
  }

  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      return NextResponse.json({ error: `재고 부족: 상품의 재고가 ${item.stock}개 남았습니다.` }, { status: 400 });
    }
  }

  const total = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  const orderStatus = paymentMethod === "virtual" ? "awaiting_deposit" : "pending";
  const order = await db.execute({
    sql: "INSERT INTO orders (user_id, total, status, receiver_name, phone, zipcode, address, address_detail, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [user.id, total, orderStatus, receiverName, phone, zipcode || "", address, addressDetail || "", paymentMethod || "card"],
  });
  const orderId = Number(order.lastInsertRowid);

  for (const item of cartItems) {
    await db.execute({
      sql: "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      args: [orderId, item.product_id, item.quantity, item.price],
    });
    await db.execute({ sql: "UPDATE products SET stock = stock - ? WHERE id = ?", args: [item.quantity, item.product_id] });
  }

  await db.execute({ sql: "DELETE FROM cart_items WHERE user_id = ?", args: [user.id] });
  return NextResponse.json({ message: "주문이 완료되었습니다.", orderId });
}
