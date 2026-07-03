import { Attachment } from "@/components/chat/attachment";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { MessageActionsPopover } from "@/components/chat/message-actions-popover";
import { ReactionPills } from "@/components/chat/reaction-pills";
import { avatarStyle } from "@/lib/avatar-style";
import { messagePreviewText } from "@/lib/message-preview";
import { splitMentions } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import type { Message, Profile } from "@/lib/types";

export function MessageBubble({
  message,
  isOwn,
  sender,
  participants,
  readByOthers,
  currentUserId,
  repliedToMessage,
  repliedToSender,
  onReact,
  onReply,
}: {
  message: Message;
  isOwn: boolean;
  sender: Profile | undefined;
  participants: Profile[];
  readByOthers: string[];
  currentUserId: string;
  repliedToMessage: Message | undefined;
  repliedToSender: Profile | undefined;
  onReact: (emoji: string) => void;
  onReply: () => void;
}) {
  const senderColor = sender ? avatarStyle(sender.id, sender.avatar_key).bg : "#4ECDC4";
  const bodySegments = message.body ? splitMentions(message.body, participants) : [];

  if (message.message_type === "game_note") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-card/85 px-3 py-1 text-center text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-sm">
          {message.body}
        </span>
      </div>
    );
  }

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
        <MessageActionsPopover isOwn={isOwn} onReact={onReact} onReply={onReply}>
          <div
            className={cn(
              "cursor-pointer rounded-3xl border-l-4 px-4 py-2.5 text-sm text-foreground shadow-md transition-transform active:scale-[0.98]",
              isOwn
                ? "rounded-br-md rounded-l-3xl border-l-0 bg-primary text-primary-foreground shadow-primary/20"
                : "rounded-bl-md bg-card",
            )}
            style={!isOwn ? { borderLeftColor: senderColor } : undefined}
          >
            {repliedToMessage && (
              <div
                className={cn(
                  "mb-1.5 rounded-xl border-l-2 px-2 py-1 text-xs opacity-80",
                  isOwn ? "border-primary-foreground/50 bg-primary-foreground/10" : "border-muted-foreground/40 bg-muted",
                )}
              >
                <p className="font-bold">{repliedToSender?.full_name ?? "Unknown"}</p>
                <p className="truncate">{messagePreviewText(repliedToMessage)}</p>
              </div>
            )}
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
        </MessageActionsPopover>
        <ReactionPills
          reactions={message.reactions}
          currentUserId={currentUserId}
          onToggle={onReact}
        />
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
