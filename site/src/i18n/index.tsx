import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EN } from './en'

export type Lang = 'tr' | 'en'
export type Text = { tr: string; en?: string }

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (text: Text) => string }

const LangContext = createContext<Ctx | null>(null)

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem('ag-lang')
    if (v === 'tr' || v === 'en') return v
  } catch {
    /* depolama kapalı olabilir */
  }
  return 'tr'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('ag-lang', l)
    } catch {
      /* yok say */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // İngilizce metni henüz yazılmamış içerik Türkçe gösterilir.
  const t = useCallback((text: Text) => (lang === 'en' && text.en ? text.en : text.tr), [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang, LangProvider içinde kullanılmalı')
  return ctx
}

/** Türkçe metni sözlükten İngilizceye çevirir (karşılığı yoksa Türkçe kalır) */
export function useTx() {
  const { lang } = useLang()
  return useCallback((s: string) => (lang === 'en' ? (EN[s] ?? s) : s), [lang])
}

/** Türkçe sayı ve birimi İngilizce yazıma çevirir: 1,8 → 1.8, 8.550 → 8,550, dk → min, bin $ → k$ */
export function enNum(s: string) {
  return s
    .replace(/(\d)\.(\d{3})/g, '$1\u0001$2')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\u0001/g, ',')
    .replace(/%(\d[\d.,–-]*)/g, '$1%')
    .replace(/ milyar \$/g, ' bn $')
    .replace(/ bin \$/g, 'k $')
    .replace(/ dk\b/g, ' min')
    .replace(/ sn\b/g, ' s')
    .replace(/ ay$/g, ' months')
    .replace(/ gün$/g, ' day')
    .replace(/ yolcu\/yıl/g, ' pax/yr')
}

export function useNum() {
  const { lang } = useLang()
  return useCallback((s: string) => (lang === 'en' ? enNum(s) : s), [lang])
}
