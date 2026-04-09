"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  receiver_name: string;
  phone: string;
  address: string;
  address_detail: string;
  payment_method: string;
  items: OrderItem[];
}

const statusMap: Record<string, string> = {
  pending: "주문접수",
  confirmed: "확인완료",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "취소됨",
};

export default function MyPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => data && setOrders(data));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">마이페이지</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400">주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm text-gray-400">주문번호 #{order.id}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                  order.status === "cancelled" ? "bg-red-100 text-red-700" :
                  order.status === "shipping" ? "bg-blue-100 text-blue-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {statusMap[order.status] || order.status}
                </span>
              </div>

              <div className="divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="py-2 flex justify-between text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>

              {order.address && (
                <div className="mt-4 pt-4 border-t text-sm text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium text-gray-700">배송지:</span>{" "}
                    {order.address} {order.address_detail}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">수령인:</span>{" "}
                    {order.receiver_name} ({order.phone})
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">결제:</span>{" "}
                    {{ card: "신용/체크카드", bank: "계좌이체", virtual: "가상계좌", phone: "휴대폰 결제", kakao: "카카오페이", naver: "네이버페이" }[order.payment_method] || order.payment_method}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex justify-end">
                <span className="font-bold text-lg">{order.total.toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
