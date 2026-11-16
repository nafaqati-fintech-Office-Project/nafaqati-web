import { useCallback, useEffect, useRef, useState } from 'react'

const LOCALES = { en: 'en-US', ar: 'ar-SA' }

// The browser's speech recognition (Chrome and Edge send the audio to Google or Microsoft, Safari to Apple). Not in
// Firefox or Brave: `supported` is false there and the mic button is hidden. Nothing goes to our servers.
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition ?? window.webkitSpeechRecognition) : undefined

// onText gets the words recognised so far; onProblem gets 'denied' | 'unavailable' | 'failed'.
export function useSpeechInput(lang, onText, onProblem) {
  const [listening, setListening] = useState(false)
  const recognizer = useRef(null)
  const handlers = useRef({ onText, onProblem })

  useEffect(() => {
    handlers.current = { onText, onProblem }
  }, [onText, onProblem])

  useEffect(() => () => recognizer.current?.abort(), [])

  const start = useCallback(() => {
    if (!Recognition) return handlers.current.onProblem('unavailable')
    recognizer.current?.abort()
    const r = new Recognition()
    r.lang = LOCALES[lang] ?? LOCALES.en
    r.interimResults = true
    r.continuous = false
    r.onresult = (event) => {
      const text = Array.from(event.results, (result) => result[0]?.transcript ?? '').join('')
      if (text) handlers.current.onText(text)
    }
    r.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      handlers.current.onProblem(
        event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'denied' : event.error === 'language-not-supported' ? 'unavailable' : 'failed',
      )
    }
    r.onend = () => setListening(false)
    recognizer.current = r
    try {
      r.start()
      setListening(true)
    } catch {
      handlers.current.onProblem('failed')
    }
  }, [lang])

  const stop = useCallback(() => recognizer.current?.stop(), [])

  return { supported: Boolean(Recognition), listening, start, stop }
}
