"use client";

import { createContext, useContext, useState } from "react";

const AnnounceContext = createContext<(msg: string) => void>(() => {});

export function useAnnounce() {
  return useContext(AnnounceContext);
}

/**
 * One always-mounted polite live region for the whole portal. Screen readers
 * need the region to EXIST before its text changes, so it renders empty on
 * every page and is filled in by useAnnounce().
 */
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <AnnounceContext.Provider value={setMessage}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}
