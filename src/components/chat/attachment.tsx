"use client";

import { useEffect, useState } from "react";
import { getSignedAttachmentUrl } from "@/lib/supabase/queries";

export function Attachment({
  path,
  type,
}: {
  path: string;
  type: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedAttachmentUrl(path).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

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
