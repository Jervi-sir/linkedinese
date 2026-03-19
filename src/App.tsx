import { useMemo, useState } from 'react'

import { ApiKeyField } from '@/components/ApiKeyField'
import { FeatureCards } from '@/components/FeatureCards'
import { GeneratedOutput } from '@/components/GeneratedOutput'
import { LengthSelector, type LengthOption } from '@/components/LengthSelector'
import { ModelSelector } from '@/components/ModelSelector'
import { StudioComposer } from '@/components/StudioComposer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ToneSelector, type ToneOption } from '@/components/ToneSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { generateLinkedInPost, getDefaultModel, presetModels } from '@/lib/gemini'
import {
  loadStoredApiKey,
  loadStoredModel,
  saveStoredApiKey,
  saveStoredModel,
} from '@/lib/storage'
import { useThemePreference } from '@/lib/theme'

const minimumInputLength = 20

function App() {
  const [view, setView] = useState<'home' | 'studio'>('home')
  const [apiKey, setApiKey] = useState(() => loadStoredApiKey())
  const [selectedModel, setSelectedModel] = useState(() => loadStoredModel() || getDefaultModel())
  const [draft, setDraft] = useState('')
  const [output, setOutput] = useState('')
  const [tone, setTone] = useState<ToneOption>('professional')
  const [length, setLength] = useState<LengthOption>('medium')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { theme, setTheme } = useThemePreference()

  const draftTooShort = draft.trim().length < minimumInputLength
  const previewOutput = useMemo(
    () =>
      output ||
      'I spent 40 minutes rewriting a rough idea from my notes into something people would actually stop and read on LinkedIn. The difference was not more effort. It was better structure, clearer stakes, and a stronger ending.',
    [output]
  )

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
    saveStoredApiKey(value)
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    saveStoredModel(value)
  }

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('Add your Gemini API key before generating a post.')
      setView('studio')
      return
    }

    if (draftTooShort) {
      setErrorMessage(`Write at least ${minimumInputLength} characters before generating.`)
      setView('studio')
      return
    }

    setView('studio')
    setIsGenerating(true)
    setErrorMessage('')

    try {
      const result = await generateLinkedInPost({
        apiKey: apiKey.trim(),
        input: draft.trim(),
        model: selectedModel.trim(),
        tone,
        length,
      })

      setOutput(result)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong while generating.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(241,151,84,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(26,94,122,0.18),_transparent_32%),linear-gradient(180deg,_var(--background)_0%,_color-mix(in_oklab,var(--background)_95%,white)_100%)] text-foreground transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(241,151,84,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(90,182,215,0.18),_transparent_30%),linear-gradient(180deg,_var(--background)_0%,_color-mix(in_oklab,var(--background)_92%,black)_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
        <header className="sticky top-3 z-20 mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-background/75 px-3 py-3 shadow-[0_20px_80px_rgba(20,35,43,0.08)] backdrop-blur sm:top-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:py-2 dark:shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-full px-2 py-2 text-left transition hover:bg-muted/70 sm:w-auto sm:px-3"
            onClick={() => setView('home')}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f19754,#1a5e7a)] text-sm font-semibold text-white">
              Li
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-base leading-none sm:text-lg">Linkedinese</span>
              <span className="block truncate text-[0.7rem] text-muted-foreground sm:text-xs">rough thought to publish-ready post</span>
            </span>
          </button>

          <div className="grid w-full grid-cols-[1fr_1fr_auto] items-center gap-2 sm:flex sm:w-auto">
            <Button variant={view === 'home' ? 'secondary' : 'ghost'} size="sm" className="h-10 rounded-full" onClick={() => setView('home')}>
              Home
            </Button>
            <Button variant={view === 'studio' ? 'secondary' : 'ghost'} size="sm" className="h-10 rounded-full" onClick={() => setView('studio')}>
              Studio
            </Button>
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
          </div>
        </header>

        {view === 'home' ? (
          <main className="grid flex-1 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
            <section className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/80 p-5 shadow-[0_24px_120px_rgba(16,35,43,0.08)] backdrop-blur sm:rounded-[2rem] sm:p-8 lg:p-10">
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(241,151,84,0.2),_transparent_62%)]" />
              <div className="relative flex h-full flex-col justify-between gap-10">
                <div className="space-y-6">
                  <Badge variant="outline" className="w-fit border-[#f19754]/40 bg-[#f19754]/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-[#9a4c18] dark:text-[#ffd0b0] sm:text-[0.7rem]">
                    Writing Studio for LinkedIn
                  </Badge>
                  <div className="space-y-4">
                    <h1 className="max-w-2xl font-heading text-4xl leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
                      Turn half-formed notes into posts that sound like you, only sharper.
                    </h1>
                    <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
                      Paste a rough thought, speak it out loud, choose the tone and length, then let Gemini reshape it into a polished LinkedIn post without the usual AI fluff.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button size="lg" className="h-11 rounded-full px-6 text-sm" onClick={() => setView('studio')}>
                      Enter the studio
                    </Button>
                    <Button size="lg" variant="outline" className="h-11 rounded-full px-6 text-sm" onClick={() => document.getElementById('feature-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                      See how it works
                    </Button>
                  </div>
                </div>

                <FeatureCards />
              </div>
            </section>

            <section className="grid gap-6">
              <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 py-0 shadow-[0_24px_100px_rgba(26,94,122,0.08)] sm:rounded-[2rem]">
                <CardHeader className="border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
                  <CardTitle className="font-heading text-2xl">Preview transformation</CardTitle>
                  <CardDescription>
                    The studio keeps the idea intact and upgrades the pacing, clarity, and finish.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-5">
                    <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Raw thought</p>
                    <p className="text-sm leading-7 text-foreground/80">
                      I keep seeing smart people post less because they think every idea has to be perfectly framed. Usually the better move is to capture the messy version first, then refine it.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-2 text-sm text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    polished output
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(160deg,rgba(26,94,122,0.1),rgba(241,151,84,0.12))] p-5">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{previewOutput}</p>
                  </div>
                </CardContent>
              </Card>

              <Card id="feature-grid" className="rounded-[1.75rem] border border-border/60 bg-card/85 py-0 sm:rounded-[2rem]">
                <CardHeader className="px-5 py-5 sm:px-6 sm:py-6">
                  <CardTitle className="font-heading text-2xl">Built for fast iteration</CardTitle>
                  <CardDescription>
                    Direct studio access, voice capture, saved model settings, and one-click regeneration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
                  {[
                    'Open the studio without signing in.',
                    'Store your Gemini API key and preferred model locally.',
                    'Switch between professional, storytelling, and viral tones.',
                    'Copy or regenerate output the moment you need another take.',
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </main>
        ) : (
          <main className="grid flex-1 gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:gap-6">
            <section className="space-y-6">
              <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 py-0 shadow-[0_24px_100px_rgba(16,35,43,0.08)] sm:rounded-[2rem]">
                <CardHeader className="gap-3 border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-heading text-2xl sm:text-3xl">Writing studio</CardTitle>
                      <CardDescription>
                        Start with a draft, note dump, voice memo transcript, or a few bullet points.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="px-3 py-1 text-xs">
                      direct access only
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="grid gap-4">
                    <ApiKeyField value={apiKey} onChange={handleApiKeyChange} />
                    <ModelSelector value={selectedModel} presets={presetModels} onChange={handleModelChange} />
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <ToneSelector value={tone} onChange={setTone} />
                    <LengthSelector value={length} onChange={setLength} />
                  </div>

                  <StudioComposer
                    apiKeyMissing={!apiKey.trim()}
                    canGenerate={Boolean(apiKey.trim()) && !draftTooShort && !isGenerating}
                    draft={draft}
                    isGenerating={isGenerating}
                    minLength={minimumInputLength}
                    onChange={setDraft}
                    onClear={() => setDraft('')}
                    onGenerate={handleGenerate}
                  />
                </CardContent>
              </Card>
            </section>

            <GeneratedOutput
              errorMessage={errorMessage}
              isGenerating={isGenerating}
              output={output}
              onRegenerate={handleGenerate}
            />
          </main>
        )}
      </div>
    </div>
  )
}

export default App
