import { Attachment } from "@/components/chat/attachment";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/lib/types";

export function MessageBubble({
  message,
  isOwn,
  sender,
  readByOthers,
}: {
  message: Message;
  isOwn: boolean;
  sender: Profile | undefined;
  readByOthers: string[];
}) {
  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="mb-1 px-1 text-xs text-muted-foreground">
          {sender?.full_name ?? "Unknown"}
        </span>
      )}
      <div
        className={cn(
          "max-w-sm rounded-2xl px-3 py-2 text-sm",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.attachment_url && (
          <div className="mb-1">
            <Attachment path={message.attachment_url} type={message.attachment_type} />
          </div>
        )}
        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
      </div>
      <span className="mt-1 px-1 text-[11px] text-muted-foreground">
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {isOwn && readByOthers.length > 0 && " · Read"}
      </span>
    </div>
  );
}
