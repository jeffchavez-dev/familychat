import { avatarStyle } from "@/lib/avatar-style";
import { useSignedUrl } from "@/lib/supabase/use-signed-url";
import { cn } from "@/lib/utils";

export function FunAvatar({
  id,
  avatarKey,
  avatarUrl,
  size = "md",
  className,
}: {
  id: string;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const style = avatarStyle(id, avatarKey);
  const photoUrl = useSignedUrl(avatarUrl ?? null);
  const sizeClass = {
    sm: "h-8 w-8 text-base",
    md: "h-10 w-10 text-xl",
    lg: "h-20 w-20 text-4xl",
  }[size];

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote signed URL, not worth Next/Image config
      <img
        src={photoUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover shadow-sm", sizeClass, className)}
      />
    );
  }

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
