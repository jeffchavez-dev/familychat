"use client";

import { useSignedUrl } from "@/lib/supabase/use-signed-url";

export function Attachment({
  path,
  type,
}: {
  path: string;
  type: string | null;
}) {
  const url = useSignedUrl(path);

  if (!url) {
    return <div className="h-32 w-48 animate-pulse rounded-md bg-muted" />;
  }

  if (type?.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote signed URL, not worth Next/Image config
      <img
        src={url}
        alt="attachment"
        className="max-h-64 max-w-64 rounded-md object-cover"
      />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-sm underline"
    >
      Download file
    </a>
  );
}
