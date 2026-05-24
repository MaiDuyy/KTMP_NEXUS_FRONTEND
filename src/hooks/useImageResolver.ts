"use client";

import { useEffect, useRef, useState } from "react";
import { useResolveWikiImagesMutation } from "../redux/feature/mrpApi";

export type ImageResolverState = {
  resolved: Record<string, string>;
  denied: Set<string>;
  loading: boolean;
};

const EMPTY: ImageResolverState = {
  resolved: {},
  denied: new Set(),
  loading: false,
};

/**
 * Resolve `image://<uuid>` references inside wiki content to direct serving paths.
 * Re-runs whenever the set of ids changes.
 */
export function useImageResolver(ids: string[]): ImageResolverState {
  const [state, setState] = useState<ImageResolverState>(EMPTY);
  const [resolveWikiImages] = useResolveWikiImagesMutation();
  const reqId = useRef(0);

  // Stable key for dependency comparison (sorted, deduped).
  const key = Array.from(new Set(ids)).sort().join(",");

  useEffect(() => {
    if (!key) {
      setState(EMPTY);
      return;
    }
    const myReq = ++reqId.current;
    setState((s) => ({ ...s, loading: true }));

    resolveWikiImages({ ids: key.split(",") })
      .unwrap()
      .then((res) => {
        if (myReq !== reqId.current) return;
        setState({
          resolved: res.resolved || {},
          denied: new Set(res.denied || []),
          loading: false,
        });
      })
      .catch(() => {
        if (myReq !== reqId.current) return;
        setState({ resolved: {}, denied: new Set(), loading: false });
      });
  }, [key, resolveWikiImages]);

  return state;
}
