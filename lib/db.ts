import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "shop.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    receiver_name TEXT,
    phone TEXT,
    zipcode TEXT,
    address TEXT,
    address_detail TEXT,
    payment_method TEXT DEFAULT 'card',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );
`);

// 기존 orders 테이블에 새 컬럼 추가 (이미 있으면 무시)
const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as any[];
const columnNames = orderColumns.map((c: any) => c.name);
if (!columnNames.includes("receiver_name")) {
  db.exec(`
    ALTER TABLE orders ADD COLUMN receiver_name TEXT;
    ALTER TABLE orders ADD COLUMN phone TEXT;
    ALTER TABLE orders ADD COLUMN zipcode TEXT;
    ALTER TABLE orders ADD COLUMN address TEXT;
    ALTER TABLE orders ADD COLUMN address_detail TEXT;
    ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'card';
  `);
}

// users 테이블에 주소 컬럼 추가
const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
const userColNames = userColumns.map((c: any) => c.name);
if (!userColNames.includes("phone")) {
  db.exec(`
    ALTER TABLE users ADD COLUMN phone TEXT;
    ALTER TABLE users ADD COLUMN zipcode TEXT;
    ALTER TABLE users ADD COLUMN address TEXT;
    ALTER TABLE users ADD COLUMN address_detail TEXT;
  `);
}

const catCount = (db.prepare("SELECT COUNT(*) as cnt FROM categories").get() as any).cnt;
if (catCount === 0) {
  const stmt = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  for (const name of ["의류", "신발", "가방"]) {
    stmt.run(name);
  }
}

export default db;
