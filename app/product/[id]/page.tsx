"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct);
  }, [id]);

  const addToCart = async () => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product?.id, quantity }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("장바구니에 추가되었습니다!");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setMessage(data.error || "오류가 발생했습니다.");
    }
  };

  if (!product) return <p className="text-center py-20 text-gray-400">로딩 중...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-6">
        &larr; 뒤로가기
      </button>

      <div className="bg-white rounded-xl border overflow-hidden grid md:grid-cols-2 gap-0">
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl text-gray-300">
              {product.category === "의류" ? "👕" : product.category === "신발" ? "👟" : "👜"}
            </span>
          )}
        </div>

        <div className="p-8 flex flex-col">
          <span className="text-sm text-gray-400">{product.category}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          <p className="text-gray-500 mt-4 flex-1">{product.description}</p>

          <div className="mt-6">
            <span className="text-3xl font-bold">{product.price.toLocaleString()}원</span>
            <span className="text-sm text-gray-400 ml-3">재고 {product.stock}개</span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <label className="text-sm text-gray-600">수량</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="mt-4 w-full bg-lime-500 text-white py-3 rounded-lg font-semibold hover:bg-lime-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? "품절" : "장바구니 담기"}
          </button>

          {message && (
            <p className="mt-3 text-center text-sm text-green-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
