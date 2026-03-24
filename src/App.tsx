import { useState } from 'react'

import { ApiKeyField } from '@/components/ApiKeyField'
import { GeneratedOutput } from '@/components/GeneratedOutput'
import { LengthSelector, type LengthOption } from '@/components/LengthSelector'
import { ModelSelector } from '@/components/ModelSelector'
import { StudioComposer } from '@/components/StudioComposer'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ToneSelector, type ToneOption } from '@/components/ToneSelector'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
      return
    }

    if (draftTooShort) {
      setErrorMessage(`Write at least ${minimumInputLength} characters before generating.`)
      return
    }

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
        <header className="sticky top-3 z-20 mb-5 flex items-center justify-between rounded-full border border-border/70 bg-background/75 px-3 py-2 shadow-[0_20px_80px_rgba(20,35,43,0.08)] backdrop-blur sm:top-4 sm:mb-6 dark:shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-3 rounded-full px-2 py-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f19754,#1a5e7a)] text-sm font-semibold text-white">
              Li
            </span>
            <span className="min-w-0">
              <span className="block font-heading text-base leading-none sm:text-lg">Linkedinese</span>
              <span className="block truncate text-[0.7rem] text-muted-foreground sm:text-xs">rough thought to publish-ready post</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onThemeChange={setTheme} />
          </div>
        </header>

        <main className="grid flex-1 gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:gap-4">
          <section className="space-y-4">
            <Alert className="border-[#f19754]/20 bg-[#f19754]/5 dark:border-[#f19754]/30 dark:bg-[#f19754]/10">
              <div className='flex flex-row items-center gap-2'>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f19754]/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#9a4c18] dark:text-[#ffd0b0]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
                <AlertTitle className="text-[#9a4c18] dark:text-[#ffd0b0]">Welcome to Linkedinese</AlertTitle>
              </div>
              <AlertDescription className="text-[#9a4c18]/80 dark:text-[#ffd0b0]/80">
                Turn your half-formed notes into sharp LinkedIn posts. Paste a rough thought, choose your tone, and let Gemini reshape it into a polished masterpiece. No AI fluff, just your voice, only sharper.
              </AlertDescription>
            </Alert>

            <Card className="rounded-[1.75rem] border border-border/60 bg-card/90 py-0 shadow-[0_24px_100px_rgba(16,35,43,0.08)] sm:rounded-[2rem]">
              <CardHeader className="gap-3 border-b border-border/60 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-heading text-2xl sm:text-3xl">Writing studio</CardTitle>
                    <CardDescription>
                      Start with a draft, note dump, or a few bullet points.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    direct access
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4 sm:px-5 sm:py-2">
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
      </div>
    </div>
  )
}

export default App
