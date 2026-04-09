"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CompleteContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="bg-white rounded-xl border p-10">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다!</h1>
        <p className="text-gray-500 mb-2">주문번호: #{orderId}</p>
        <p className="text-sm text-gray-400 mb-8">
          주문 내역은 마이페이지에서 확인하실 수 있습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/mypage"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 text-sm"
          >
            주문내역 보기
          </Link>
          <Link
            href="/"
            className="border px-6 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-gray-400">로딩 중...</p>}>
      <CompleteContent />
    </Suspense>
  );
}
