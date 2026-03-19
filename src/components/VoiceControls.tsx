import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createSpeechController, type SpeechController } from '@/lib/speech'

type VoiceControlsProps = {
  transcript: string
  onError: (message: string) => void
  onPause: () => void
  onStart: () => void
  onTranscript: (transcript: string) => void
}

export function VoiceControls({
  transcript,
  onError,
  onPause,
  onStart,
  onTranscript,
}: VoiceControlsProps) {
  const controllerRef = useRef<SpeechController | null>(null)
  const [isListening, setIsListening] = useState(false)

  const controller = useMemo(
    () =>
      createSpeechController({
        onEnd: () => setIsListening(false),
        onError: (message) => {
          setIsListening(false)
          onError(message)
        },
        onStart: () => {
          setIsListening(true)
          onStart()
        },
        onTranscript,
      }),
    [onError, onStart, onTranscript]
  )

  useEffect(() => {
    controllerRef.current = controller

    return () => {
      controller.stop()
    }
  }, [controller])

  const isSupported = controller.isSupported

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-md">
          <p className="text-xs text-muted-foreground">
            {isListening ? "Streaming directly into your draft. Pause when you're done." : "Use voice input to quickly capture ideas while they're fresh."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isListening ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-full px-4 text-xs font-semibold"
              onClick={() => controllerRef.current?.start()}
              disabled={!isSupported}
            >
              Start voice input
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-full px-4 text-xs font-semibold"
              onClick={() => {
                controllerRef.current?.stop()
                setIsListening(false)
                onPause()
              }}
              disabled={!isSupported}
            >
              Pause capture
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 transition-all hover:bg-muted/30">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Live speech transcript
          </p>
          <Badge variant={isListening ? 'default' : 'outline'} className="h-5 px-2 text-[0.6rem]">
            {isListening ? 'Listening...' : 'Idle'}
          </Badge>
        </div>
        <p className="min-h-[3rem] whitespace-pre-wrap text-sm leading-6 text-foreground/80 transition-opacity">
          {transcript || (isSupported ? 'Your voice will appear here in real-time.' : 'Speech recognition not supported.')}
        </p>
      </div>

    </div>
  )
}
