"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

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
  user_name: string;
  user_email: string;
  items: OrderItem[];
}

interface Category {
  id: number;
  name: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"products" | "orders" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", stock: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") router.push("/");
      });
    loadProducts();
    loadOrders();
    loadCategories();
  }, []);

  const loadProducts = () => fetch("/api/products").then((r) => r.json()).then(setProducts);
  const loadOrders = () => fetch("/api/orders").then((r) => r.json()).then(setOrders);
  const loadCategories = () => fetch("/api/categories").then((r) => r.json()).then(setCategories);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 400;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setUploading(false);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price), stock: Number(form.stock) };

    if (editId) {
      await fetch(`/api/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setShowForm(false);
    setEditId(null);
    setForm({ name: "", description: "", price: "", category: "", stock: "", image: "" });
    if (fileRef.current) fileRef.current.value = "";
    loadProducts();
  };

  const editProduct = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      stock: String(p.stock),
      image: p.image || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadProducts();
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.trim() }),
    });
    if (res.ok) {
      setNewCat("");
      loadCategories();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const updateCategory = async (id: number) => {
    if (!editCatName.trim()) return;
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editCatName.trim() }),
    });
    setEditCatId(null);
    setEditCatName("");
    loadCategories();
    loadProducts();
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("이 카테고리를 삭제하시겠습니까?")) return;
    await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadCategories();
  };

  const updateOrderStatus = async (id: number, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  const statusMap: Record<string, string> = {
    pending: "주문접수", awaiting_deposit: "입금대기", deposit_confirmed: "입금확인", confirmed: "확인완료", shipping: "배송중", delivered: "배송완료", cancelled: "취소됨",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">관리자 페이지</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-lg text-sm ${tab === "products" ? "bg-lime-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
        >
          상품 관리
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-lg text-sm ${tab === "categories" ? "bg-lime-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
        >
          카테고리 관리
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 rounded-lg text-sm ${tab === "orders" ? "bg-lime-500 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
        >
          주문 관리
        </button>
      </div>

      {tab === "products" && (
        <div>
          <button
            onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", description: "", price: "", category: categories[0]?.name || "", stock: "", image: "" }); }}
            className={`mb-4 px-4 py-2 rounded-lg text-sm font-semibold ${showForm ? "bg-sky-300 text-white hover:bg-sky-400" : "bg-lime-500 text-white hover:bg-lime-600"}`}
          >
            {showForm ? "취소" : "+ 상품 등록"}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">상품명</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">가격 (원)</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">재고</label>
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">상품 이미지</label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:cursor-pointer hover:file:bg-gray-200"
                  />
                  {uploading && <span className="text-sm text-gray-400">업로드 중...</span>}
                  {form.image && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={form.image} alt="미리보기" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: "" })}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl"
                      >
                        x
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
              <div className="col-span-2">
                <button type="submit" className="bg-lime-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-lime-600">
                  {editId ? "수정" : "등록"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">이미지</th>
                  <th className="text-left p-3">상품명</th>
                  <th className="text-left p-3">카테고리</th>
                  <th className="text-right p-3">가격</th>
                  <th className="text-right p-3">재고</th>
                  <th className="text-right p-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-lg">
                          {p.category === "의류" ? "👕" : p.category === "신발" ? "👟" : "👜"}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 text-right">{p.price.toLocaleString()}원</td>
                    <td className="p-3 text-right">{p.stock}</td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => editProduct(p)} className="text-blue-600 hover:underline">수정</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:underline">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "categories" && (
        <div>
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="font-bold mb-4">카테고리 추가</h2>
            <div className="flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="새 카테고리명 입력"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <button
                onClick={addCategory}
                className="bg-lime-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-lime-600"
              >
                추가
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">카테고리명</th>
                  <th className="text-right p-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="p-3">{cat.id}</td>
                    <td className="p-3">
                      {editCatId === cat.id ? (
                        <input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && updateCategory(cat.id)}
                          className="border rounded-lg px-3 py-1.5 text-sm w-48"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{cat.name}</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {editCatId === cat.id ? (
                        <>
                          <button onClick={() => updateCategory(cat.id)} className="text-green-600 hover:underline">저장</button>
                          <button onClick={() => { setEditCatId(null); setEditCatName(""); }} className="text-sky-400 hover:text-sky-500 hover:underline">취소</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditCatId(cat.id); setEditCatName(cat.name); }} className="text-blue-600 hover:underline">수정</button>
                          <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:underline">삭제</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">주문이 없습니다.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-medium">주문 #{order.id}</span>
                    <p className="text-sm text-gray-500">{order.user_name} ({order.user_email})</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="border rounded-lg px-3 py-1.5 text-sm"
                  >
                    {Object.entries(statusMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="divide-y text-sm">
                  {order.items.map((item, i) => (
                    <div key={i} className="py-2 flex justify-between">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t text-right font-bold">{order.total.toLocaleString()}원</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
