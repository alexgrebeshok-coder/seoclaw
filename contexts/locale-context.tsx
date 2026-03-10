"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { format, parseISO } from "date-fns";

import {
  type Locale,
  dateLocales,
  getEnumLabel,
  getMessage,
  localeOptions,
  type MessageKey,
} from "@/lib/translations";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  enumLabel: (category: "severity" | "projectStatus" | "taskStatus" | "priority" | "direction" | "riskStatus", value: string) => string;
  formatDateLocalized: (date: string, pattern?: string) => string;
}

const STORAGE_KEY = "ceoclaw-locale";
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (savedLocale && localeOptions.some((option) => option.code === savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    const option = localeOptions.find((item) => item.code === locale);
    document.documentElement.lang = option?.htmlLang ?? locale;
    document.documentElement.dataset.scrollBehavior = "smooth";
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
        localStorage.setItem(STORAGE_KEY, nextLocale);
      },
      t: (key, values) => getMessage(locale, key, values),
      enumLabel: (category, value) => getEnumLabel(locale, category, value),
      formatDateLocalized: (date, pattern = "d MMM") =>
        format(parseISO(date), pattern, { locale: dateLocales[locale] }),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
