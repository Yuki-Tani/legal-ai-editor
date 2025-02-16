"use client";

import React, { createContext, ReactNode, useState } from "react";

export const AppStateContext = createContext<ProviderContext | undefined>(
  undefined
);

type ProviderContext = {
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
};

export function Provider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState("");

  const draftObject = {
    draft,
    setDraft,
  };

  return (
    <AppStateContext.Provider value={draftObject}>
      {children}
    </AppStateContext.Provider>
  );
}
export default Provider;
