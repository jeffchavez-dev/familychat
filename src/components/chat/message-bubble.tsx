import { Attachment } from "@/components/chat/attachment";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { avatarStyle } from "@/lib/avatar-style";
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
  const senderColor = sender ? avatarStyle(sender.id, sender.avatar_key).bg : "#4ECDC4";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isOwn && (
        <FunAvatar
          id={sender?.id ?? "unknown"}
          avatarKey={sender?.avatar_key}
          avatarUrl={sender?.avatar_url}
          size="sm"
        />
      )}
      <div className={cn("flex max-w-[75%] flex-col", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <span className="mb-1 px-1 text-xs font-bold text-muted-foreground">
            {sender?.full_name ?? "Unknown"}
          </span>
        )}
        <div
          className={cn(
            "rounded-3xl px-4 py-2.5 text-sm shadow-sm",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md text-foreground",
          )}
          style={!isOwn ? { backgroundColor: `${senderColor}26` } : undefined}
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
          {isOwn && readByOthers.length > 0 && " · Seen 👀"}
        </span>
      </div>
    </div>
  );
}
