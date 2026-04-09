"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: number;
  quantity: number;
  product_id: number;
  name: string;
  price: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const loadCart = () => {
    fetch("/api/cart")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => data && setItems(data));
  };

  useEffect(() => { loadCart(); }, []);

  const removeItem = async (itemId: number) => {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    loadCart();
  };

  const goToCheckout = () => {
    router.push("/checkout");
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">장바구니</h1>

      {message && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{message}</div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400">장바구니가 비어있습니다.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.price.toLocaleString()}원 x {item.quantity}개
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border mt-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">총 금액</span>
              <span className="text-2xl font-bold">{total.toLocaleString()}원</span>
            </div>
            <button
              onClick={goToCheckout}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800"
            >
              주문하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
