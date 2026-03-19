import { useRef, useState } from 'react'

import { VoiceControls } from '@/components/VoiceControls'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type StudioComposerProps = {
  apiKeyMissing: boolean
  canGenerate: boolean
  draft: string
  isGenerating: boolean
  minLength: number
  onChange: (value: string) => void
  onClear: () => void
  onGenerate: () => void
}

function appendTranscript(base: string, transcript: string) {
  const trimmedTranscript = transcript.trim()

  if (!trimmedTranscript) {
    return base
  }

  return base.trim() ? `${base.trim()}\n\n${trimmedTranscript}` : trimmedTranscript
}

export function StudioComposer({
  apiKeyMissing,
  canGenerate,
  draft,
  isGenerating,
  minLength,
  onChange,
  onClear,
  onGenerate,
}: StudioComposerProps) {
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [speechError, setSpeechError] = useState('')
  const listeningBaseRef = useRef(draft)

  const handleVoiceStart = () => {
    listeningBaseRef.current = draft
    setVoiceTranscript('')
    setSpeechError('')
  }

  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript)
    onChange(appendTranscript(listeningBaseRef.current, transcript))
  }

  const handleVoicePause = () => {
    listeningBaseRef.current = appendTranscript(listeningBaseRef.current, voiceTranscript)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-border/60 bg-background/50 p-5 sm:p-6 space-y-6 shadow-inner">
        <VoiceControls
          transcript={voiceTranscript}
          onError={setSpeechError}
          onPause={handleVoicePause}
          onStart={handleVoiceStart}
          onTranscript={handleVoiceTranscript}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <Label htmlFor="raw-draft" className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Main draft editor
            </Label>
            <span className="text-[0.65rem] text-muted-foreground whitespace-nowrap">Min. {minLength} chars</span>
          </div>
          <Textarea
            id="raw-draft"
            placeholder="Your thoughts go here. Start typing or use the voice capture above."
            value={draft}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[18rem] rounded-[1.5rem] border-none bg-transparent px-0 p-5 py-3 text-base leading-7 ring-0 focus-visible:ring-0 resize-none shadow-none"
          />
        </div>
      </div>

      {speechError ? (
        <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
          <AlertTitle>Voice input unavailable</AlertTitle>
          <AlertDescription>{speechError}</AlertDescription>
        </Alert>
      ) : null}

      {apiKeyMissing ? (
        <Alert className="rounded-2xl border-primary/20 bg-primary/8">
          <AlertTitle>Add your API key</AlertTitle>
          <AlertDescription>
            Generation stays disabled until a Gemini API key is saved in the field above.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {draft.trim().length} characters in the current draft.
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="lg" className="h-11 rounded-full px-5" onClick={onClear} disabled={!draft || isGenerating}>
            Clear input
          </Button>
          <Button type="button" size="lg" className="h-11 rounded-full px-5" onClick={onGenerate} disabled={!canGenerate}>
            {isGenerating ? 'Generating...' : 'Generate post'}
          </Button>
        </div>
      </div>
    </div>
  )
}
