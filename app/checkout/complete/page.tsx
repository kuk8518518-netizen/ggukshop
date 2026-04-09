"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CompleteContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const payment = searchParams.get("payment");

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <div className="bg-white rounded-xl border p-10">
        <div className="text-5xl mb-4">&#10003;</div>
        <h1 className="text-2xl font-bold mb-2">주문이 완료되었습니다!</h1>
        <p className="text-gray-500 mb-2">주문번호: #{orderId}</p>

        {payment === "virtual" ? (
          <div className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <p className="font-bold text-sm mb-3 text-center">아래 계좌로 입금해주세요</p>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">은행:</span> <span className="font-semibold">국민은행</span></p>
              <p><span className="text-gray-500">계좌:</span> <span className="font-semibold">944502-00-513288</span></p>
              <p><span className="text-gray-500">예금주:</span> <span className="font-semibold">국예찬</span></p>
            </div>
            <p className="text-xs text-yellow-700 mt-3 text-center">입금 확인 후 배송이 시작됩니다.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-8">
            주문 내역은 마이페이지에서 확인하실 수 있습니다.
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link
            href="/mypage"
            className="bg-lime-500 text-white px-6 py-2.5 rounded-lg hover:bg-lime-600 text-sm font-semibold"
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
