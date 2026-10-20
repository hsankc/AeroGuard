import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

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
    document.documentElement.lang = l
    try {
      localStorage.setItem('ag-lang', l)
    } catch {
      /* yok say */
    }
  }, [])

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
