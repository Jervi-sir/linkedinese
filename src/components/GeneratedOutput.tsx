import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type GeneratedOutputProps = {
  errorMessage: string
  isGenerating: boolean
  output: string
  onRegenerate: () => void
}

export function GeneratedOutput({
  errorMessage,
  isGenerating,
  output,
  onRegenerate,
}: GeneratedOutputProps) {
  const handleCopy = async () => {
    if (!output) {
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      toast.success('Copied LinkedIn post to clipboard.')
    } catch {
      toast.error('Clipboard access failed. Try copying manually.')
    }
  }

  return (
    <Card className="rounded-[2rem] border border-border/60 bg-card/90 py-0 shadow-[0_24px_100px_rgba(16,35,43,0.08)]">
      <CardHeader className="gap-3 border-b border-border/60 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-3xl">Generated post</CardTitle>
            <CardDescription>
              Review, copy, or regenerate after each pass.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output}>
              Copy
            </Button>
            <Button size="sm" onClick={onRegenerate} disabled={!output || isGenerating}>
              Regenerate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-6 py-6">
        {errorMessage ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTitle>Generation error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="min-h-[28rem] rounded-[1.5rem] border border-border/60 bg-background/75 p-5">
          {isGenerating ? (
            <div className="flex h-full min-h-[24rem] flex-col justify-center gap-4">
              <div className="h-2 w-28 rounded-full bg-primary/25" />
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-2 w-[92%] rounded-full bg-muted" />
              <div className="h-2 w-[84%] rounded-full bg-muted" />
              <p className="text-sm text-muted-foreground">Gemini is rewriting your draft...</p>
            </div>
          ) : output ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{output}</p>
          ) : (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-border bg-muted/25 p-8 text-center">
              <p className="font-heading text-2xl text-foreground">Nothing generated yet</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Add your notes, choose a tone and length, then generate a polished post here.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
