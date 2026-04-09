import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST() {
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
  if (!adminExists) {
    const hashed = bcrypt.hashSync("admin1234", 10);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      "admin@shop.com", hashed, "관리자", "admin"
    );
  }

  const productCount = (db.prepare("SELECT COUNT(*) as cnt FROM products").get() as any).cnt;
  if (productCount === 0) {
    const products = [
      { name: "클래식 티셔츠", desc: "편안한 면 소재의 기본 티셔츠", price: 29000, category: "의류", stock: 50 },
      { name: "슬림핏 청바지", desc: "스타일리시한 슬림핏 데님", price: 59000, category: "의류", stock: 30 },
      { name: "캔버스 스니커즈", desc: "가벼운 캔버스 소재 운동화", price: 45000, category: "신발", stock: 25 },
      { name: "가죽 크로스백", desc: "고급 소가죽 크로스백", price: 89000, category: "가방", stock: 15 },
      { name: "니트 카디건", desc: "부드러운 울 블렌드 카디건", price: 65000, category: "의류", stock: 20 },
      { name: "러닝화", desc: "쿠션감 좋은 러닝화", price: 79000, category: "신발", stock: 40 },
      { name: "토트백", desc: "넉넉한 사이즈의 캔버스 토트백", price: 35000, category: "가방", stock: 35 },
      { name: "후드 집업", desc: "따뜻한 기모 안감 후드 집업", price: 55000, category: "의류", stock: 45 },
    ];

    const stmt = db.prepare("INSERT INTO products (name, description, price, category, stock) VALUES (?, ?, ?, ?, ?)");
    for (const p of products) {
      stmt.run(p.name, p.desc, p.price, p.category, p.stock);
    }
  }

  return NextResponse.json({ message: "초기 데이터가 생성되었습니다." });
}
