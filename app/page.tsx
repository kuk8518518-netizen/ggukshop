"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);

  const loadCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.map((c: any) => c.name)));
  };

  const loadProducts = (cat?: string, q?: string) => {
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (q) params.set("search", q);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
        if (!seeded && data.length === 0) {
          fetch("/api/admin/seed", { method: "POST" }).then(() => {
            setSeeded(true);
            loadProducts();
          });
        }
      });
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const filterByCategory = (cat: string) => {
    setCategory(cat);
    setSearch("");
    loadProducts(cat, "");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCategory("");
    loadProducts("", search);
  };

  // categories는 DB에서 동적으로 로드됨

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">온라인 쇼핑몰</h1>
        <p className="text-gray-500">다양한 상품을 만나보세요</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="상품 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="bg-lime-500 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-lime-600"
          >
            검색
          </button>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => filterByCategory("")}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
              category === "" ? "bg-lime-500 text-white border-lime-500" : "bg-white text-gray-700 border-gray-300 hover:bg-lime-50"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => filterByCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                category === cat ? "bg-lime-500 text-white border-lime-500" : "bg-white text-gray-700 border-gray-300 hover:bg-lime-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-400 py-20">상품을 불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="bg-white rounded-xl border hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100 rounded-t-xl flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-gray-300">
                    {product.category === "의류" ? "👕" : product.category === "신발" ? "👟" : "👜"}
                  </span>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-gray-400">{product.category}</span>
                <h3 className="font-medium text-gray-900 mt-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-lg">{product.price.toLocaleString()}원</span>
                  <span className="text-xs text-gray-400">재고 {product.stock}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
