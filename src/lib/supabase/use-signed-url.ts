import { useEffect, useState } from "react";
import { getSignedAttachmentUrl } from "@/lib/supabase/queries";

export function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loadedForPath, setLoadedForPath] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    getSignedAttachmentUrl(path).then((signed) => {
      if (!cancelled) {
        setUrl(signed);
        setLoadedForPath(path);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path || loadedForPath !== path) return null;
  return url;
}
