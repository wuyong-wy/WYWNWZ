"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8613800138000";

interface WhatsAppFloatProps {
  productName?: string;
}

export function WhatsAppFloat({ productName }: WhatsAppFloatProps) {
  const message = productName
    ? `Hi, I'm interested in: ${productName}. Could you provide more details?`
    : "Hi, I'd like to inquire about your products.";

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
