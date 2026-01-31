"use client";

import { useCallback, useContext } from "react";
import { I18nContext } from "@/components/providers/i18n-provider";

/**
 * Hook for accessing translations and locale
 * @returns {object} - Translation function and locale info
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }

  const { dictionary, locale, setLocale } = context;

  /**
   * Get translation by key path (e.g., "dashboard.title")
   * @param {string} key - Dot-separated key path
   * @param {object} params - Optional interpolation params
   * @returns {string} - Translated string
   */
  const t = useCallback(
    (key, params) => {
      const keys = key.split(".");
      let value = dictionary;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof value !== "string") {
        console.warn(`Translation key is not a string: ${key}`);
        return key;
      }

      // Simple interpolation
      if (params) {
        return Object.entries(params).reduce(
          (str, [key, val]) => str.replace(`{{${key}}}`, String(val)),
          value
        );
      }

      return value;
    },
    [dictionary]
  );

  return {
    t,
    locale,
    setLocale,
    dictionary,
  };
}
