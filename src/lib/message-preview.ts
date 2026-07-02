import type { Message } from "@/lib/types";

export function messagePreviewText(message: Message) {
  if (message.body) return message.body;
  if (message.attachment_type?.startsWith("image/")) return "📷 Photo";
  if (message.attachment_url) return "📎 Attachment";
  return "";
}
