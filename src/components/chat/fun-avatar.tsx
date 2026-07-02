import { avatarStyle } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";

export function FunAvatar({
  id,
  size = "md",
  className,
}: {
  id: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const style = avatarStyle(id);
  const sizeClass = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-xl",
    lg: "h-20 w-20 text-4xl",
  }[size];

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full shadow-sm",
        sizeClass,
        className,
      )}
      style={{ backgroundColor: style.bg }}
    >
      {style.emoji}
    </span>
  );
}
