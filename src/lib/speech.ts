type SpeechControllerOptions = {
  onEnd: () => void
  onError: (message: string) => void
  onStart: () => void
  onTranscript: (transcript: string) => void
}

type SpeechRecognitionAlternative = {
  transcript: string
}

type SpeechRecognitionResult = {
  0: SpeechRecognitionAlternative
  isFinal: boolean
}

type SpeechRecognitionResultList = {
  length: number
  [index: number]: SpeechRecognitionResult
}

type SpeechRecognitionEvent = {
  resultIndex: number
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onstart: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

export type SpeechController = {
  isSupported: boolean
  start: () => void
  stop: () => void
}

export function createSpeechController(options: SpeechControllerOptions): SpeechController {
  const SpeechRecognitionConstructor =
    typeof window === 'undefined' ? undefined : window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognitionConstructor) {
    return {
      isSupported: false,
      start: () => {
        options.onError('This browser does not support the Web Speech API.')
      },
      stop: () => undefined,
    }
  }

  const recognition = new SpeechRecognitionConstructor()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onstart = () => {
    options.onStart()
  }

  recognition.onend = () => {
    options.onEnd()
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'aborted') {
      return
    }

    const message =
      event.error === 'not-allowed'
        ? 'Microphone access was blocked. Allow microphone permission and try again.'
        : 'Speech recognition failed. Please try again.'

    options.onError(message)
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let nextTranscript = ''

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      nextTranscript += event.results[index][0]?.transcript || ''
    }

    options.onTranscript(nextTranscript.trim())
  }

  return {
    isSupported: true,
    start: () => {
      try {
        recognition.start()
      } catch {
        options.onError('Speech recognition is already running.')
      }
    },
    stop: () => {
      recognition.stop()
    },
  }
}
