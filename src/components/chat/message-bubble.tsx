import { Attachment } from "@/components/chat/attachment";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { avatarStyle } from "@/lib/avatar-style";
import { splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/lib/types";

export function MessageBubble({
  message,
  isOwn,
  sender,
  participants,
  readByOthers,
}: {
  message: Message;
  isOwn: boolean;
  sender: Profile | undefined;
  participants: Profile[];
  readByOthers: string[];
}) {
  const senderColor = sender ? avatarStyle(sender.id, sender.avatar_key).bg : "#4ECDC4";
  const bodySegments = message.body ? splitMentions(message.body, participants) : [];

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
          <span
            className="mb-1 rounded-full bg-card/85 px-2 py-0.5 text-xs font-bold text-foreground shadow-sm backdrop-blur-sm"
            style={{ color: senderColor }}
          >
            {sender?.full_name ?? "Unknown"}
          </span>
        )}
        <div
          className={cn(
            "rounded-3xl border-l-4 px-4 py-2.5 text-sm text-foreground shadow-md",
            isOwn
              ? "rounded-br-md rounded-l-3xl border-l-0 bg-primary text-primary-foreground shadow-primary/20"
              : "rounded-bl-md bg-card",
          )}
          style={!isOwn ? { borderLeftColor: senderColor } : undefined}
        >
          {message.attachment_url && (
            <div className="mb-1">
              <Attachment path={message.attachment_url} type={message.attachment_type} />
            </div>
          )}
          {message.body && (
            <p className="whitespace-pre-wrap">
              {bodySegments.map((segment, i) =>
                "mention" in segment ? (
                  <span
                    key={i}
                    className={cn(
                      "rounded-md px-1 font-bold",
                      isOwn ? "bg-primary-foreground/20" : "bg-primary/15 text-primary",
                    )}
                  >
                    @{segment.mention}
                  </span>
                ) : (
                  <span key={i}>{segment.text}</span>
                ),
              )}
            </p>
          )}
        </div>
        <span className="mt-1 rounded-full bg-card/85 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur-sm">
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
