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

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [form, setForm] = useState({
    receiverName: "",
    phone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    paymentMethod: "card",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          if (data.length === 0) { router.push("/cart"); return; }
          setItems(data);
        }
      });

    // 저장된 주소 불러오기
    fetch("/api/auth/address")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) {
          setForm((prev) => ({ ...prev, receiverName: data.name }));
        }
        if (data.address) {
          setHasSavedAddress(true);
          setForm((prev) => ({
            ...prev,
            receiverName: data.name || prev.receiverName,
            phone: data.phone || "",
            zipcode: data.zipcode || "",
            address: data.address || "",
            addressDetail: data.address_detail || "",
          }));
        }
      });
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSaveAddress = async () => {
    await fetch("/api/auth/address", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: form.phone,
        zipcode: form.zipcode,
        address: form.address,
        addressDetail: form.addressDetail,
      }),
    });
    setSavedMsg("주소가 저장되었습니다!");
    setHasSavedAddress(true);
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // 주소 저장 체크되어 있으면 자동 저장
    if (saveAddress) {
      await fetch("/api/auth/address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          zipcode: form.zipcode,
          address: form.address,
          addressDetail: form.addressDetail,
        }),
      });
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      router.push(`/checkout/complete?orderId=${data.orderId}&payment=${form.paymentMethod}`);
    } else {
      setError(data.error);
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: "card", label: "신용/체크카드" },
    { value: "bank", label: "계좌이체" },
    { value: "virtual", label: "가상계좌" },
    { value: "phone", label: "휴대폰 결제" },
    { value: "kakao", label: "카카오페이" },
    { value: "naver", label: "네이버페이" },
  ];

  if (items.length === 0) return <p className="text-center py-20 text-gray-400">로딩 중...</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">주문/결제</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
        {/* 왼쪽: 배송지 + 결제 */}
        <div className="md:col-span-2 space-y-6">
          {/* 배송지 정보 */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">배송지 정보</h2>
              {hasSavedAddress && (
                <span className="text-xs text-lime-600 bg-lime-50 px-2 py-1 rounded-full">저장된 주소 적용됨</span>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">수령인 *</label>
                  <input
                    value={form.receiverName}
                    onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="이름 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">연락처 *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => {
                      const nums = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
                      let formatted = nums;
                      if (nums.length <= 3) {
                        formatted = nums;
                      } else if (nums.length <= 7) {
                        formatted = `${nums.slice(0, 3)}-${nums.slice(3)}`;
                      } else {
                        formatted = `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
                      }
                      setForm({ ...form, phone: formatted });
                    }}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">우편번호</label>
                <input
                  value={form.zipcode}
                  onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="우편번호 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">주소 *</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="기본 주소 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">상세주소</label>
                <input
                  value={form.addressDetail}
                  onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="동/호수 등 상세주소 입력"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="accent-lime-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">이 주소를 다음에도 사용</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  className="text-sm text-lime-600 hover:text-lime-700 font-medium"
                >
                  주소 저장
                </button>
              </div>
              {savedMsg && (
                <p className="text-sm text-lime-600">{savedMsg}</p>
              )}
            </div>
          </div>

          {/* 결제 방법 */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">결제 방법</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    form.paymentMethod === method.value
                      ? "border-lime-500 bg-lime-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={form.paymentMethod === method.value}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="accent-lime-500"
                  />
                  <span className="text-sm">{method.label}</span>
                </label>
              ))}
            </div>

            {form.paymentMethod === "virtual" && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-bold text-sm mb-2">입금 계좌 안내</p>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">은행:</span> <span className="font-semibold">국민은행</span></p>
                  <p><span className="text-gray-500">계좌:</span> <span className="font-semibold">944502-00-513288</span></p>
                  <p><span className="text-gray-500">예금주:</span> <span className="font-semibold">국예찬</span></p>
                </div>
                <p className="text-xs text-yellow-700 mt-3">주문 후 위 계좌로 입금해주시면, 확인 후 배송이 시작됩니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 주문 요약 */}
        <div>
          <div className="bg-white rounded-xl border p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">주문 요약</h2>
            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">{item.quantity}개</p>
                  </div>
                  <span>{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>

            <div className="border-t mt-2 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">상품금액</span>
                <span>{total.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">배송비</span>
                <span>{total >= 50000 ? "무료" : "3,000원"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>총 결제금액</span>
                <span>{(total + (total >= 50000 ? 0 : 3000)).toLocaleString()}원</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full bg-lime-500 text-white py-3 rounded-lg font-semibold hover:bg-lime-600 disabled:bg-gray-400"
            >
              {submitting ? "처리 중..." : `${(total + (total >= 50000 ? 0 : 3000)).toLocaleString()}원 결제하기`}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              5만원 이상 무료배송
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
