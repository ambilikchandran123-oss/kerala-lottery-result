'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '@/locales/en.json';
import mlTranslations from '@/locales/ml.json';
import taTranslations from '@/locales/ta.json';
import hiTranslations from '@/locales/hi.json';

export type Language = 'en' | 'ml' | 'ta' | 'hi';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' }
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof enTranslations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ml');

  useEffect(() => {
    const saved = localStorage.getItem('kerala_lottery_lang') as Language;
    if (saved && ['en', 'ml', 'ta', 'hi'].includes(saved)) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = 'ml';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('kerala_lottery_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const t = (key: keyof typeof enTranslations): string => {
    let dict: Record<string, string>;
    switch (language) {
      case 'ml':
        dict = mlTranslations as Record<string, string>;
        break;
      case 'ta':
        dict = taTranslations as Record<string, string>;
        break;
      case 'hi':
        dict = hiTranslations as Record<string, string>;
        break;
      default:
        dict = enTranslations as Record<string, string>;
        break;
    }
    return dict[key] || (enTranslations as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
