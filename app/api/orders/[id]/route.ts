import { NextRequest, NextResponse } from "next/server";
import { initDB } from "@/lib/db";
import { getUser } from "@/lib/auth";

const statusMessages: Record<string, string> = {
  pending: "주문이 접수되었습니다.",
  awaiting_deposit: "입금 대기 중입니다. 계좌로 입금해주세요.",
  deposit_confirmed: "입금이 확인되었습니다. 곧 배송 준비를 시작합니다.",
  confirmed: "주문이 확인되었습니다. 배송 준비 중입니다.",
  shipping: "상품이 배송 중입니다.",
  delivered: "배송이 완료되었습니다. 감사합니다!",
  cancelled: "주문이 반려되었습니다.",
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await initDB();
  const user = await getUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  const order = await db.execute({ sql: "SELECT user_id, id FROM orders WHERE id = ?", args: [id] });
  if (order.rows.length === 0) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  await db.execute({ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [status, id] });

  const orderRow = order.rows[0] as any;
  const message = `주문 #${orderRow.id}: ${statusMessages[status] || `상태가 변경되었습니다. (${status})`}`;
  await db.execute({
    sql: "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
    args: [orderRow.user_id, message],
  });

  return NextResponse.json({ message: "주문 상태가 변경되었습니다." });
}
