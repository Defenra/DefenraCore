import { en } from "./en";
import { ru } from "./ru";

export const dictionaries = {
  en,
  ru,
};

export function getDictionary(locale) {
  return dictionaries[locale];
}
