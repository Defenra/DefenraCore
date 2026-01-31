"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { dictionaries } from "@/dictionaries";

export const I18nContext = createContext(null);

export function I18nProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocaleState] = useState(defaultLocale);

  // Load locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("defenra-locale");
    if (stored && stored in dictionaries) {
      setLocaleState(stored);
    }
  }, []);

  // Save locale to localStorage when changed
  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem("defenra-locale", newLocale);
  }, []);

  const dictionary = useMemo(() => dictionaries[locale], [locale]);

  const value = useMemo(
    () => ({
      dictionary,
      locale,
      setLocale,
    }),
    [dictionary, locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
