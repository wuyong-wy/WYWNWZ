/**
 * FastAPI HTTP 客户端 — 询盘提交
 */

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001";

export interface InquiryPayload {
  saleor_product_id?: string;
  product_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company?: string;
  quantity?: string;
  delivery_deadline?: string;
  message?: string;
  language?: string;
  source_url?: string;
}

export interface InquiryResponse {
  success: boolean;
  inquiry_id: string;
}

export async function submitInquiry(
  payload: InquiryPayload
): Promise<InquiryResponse> {
  const response = await fetch(`${FASTAPI_URL}/api/inquiries/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}
