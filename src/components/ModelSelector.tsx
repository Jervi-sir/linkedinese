import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ModelSelectorProps = {
  value: string
  presets: string[]
  onChange: (value: string) => void
}

export function ModelSelector({ value, presets, onChange }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="gemini-model" className="text-sm font-medium">
        Gemini model
      </Label>
      <div className="flex flex-wrap gap-2">
        {presets.map((model) => {
          const active = value === model

          return (
            <button
              key={model}
              type="button"
              className={`rounded-full border px-3 py-2 text-xs font-medium transition ${active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted'
                }`}
              onClick={() => onChange(model)}
            >
              {model}
            </button>
          )
        })}
      </div>
      <Input
        id="gemini-model"
        placeholder="Use a custom Gemini model"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl px-3 text-sm"
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Saved locally under `linkedinese_gemini_model`.
      </p>
    </div>
  )
}
