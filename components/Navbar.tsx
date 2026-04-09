"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-gray-900">
          꾹가네 쇼핑몰
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            상품
          </Link>

          {user ? (
            <>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">
                장바구니
              </Link>
              <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
                마이페이지
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
                  관리자
                </Link>
              )}
              <span className="text-sm text-gray-500">{user.name}님</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                로그인
              </Link>
              <Link
                href="/register"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
