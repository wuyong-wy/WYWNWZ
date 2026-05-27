/**
 * 全局常量 — 从环境变量读取，避免硬编码域名和联系信息
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "Foreign Trade";
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@yourdomain.com";
export const CONTACT_PHONE =
  process.env.NEXT_PUBLIC_CONTACT_PHONE || "+86 138-0013-8000";
