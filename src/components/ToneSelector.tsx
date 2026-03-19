import { Label } from '@/components/ui/label'

export type ToneOption = 'professional' | 'storytelling' | 'viral'

const options: Array<{ value: ToneOption; description: string }> = [
  { value: 'professional', description: 'clear, credible, polished' },
  { value: 'storytelling', description: 'narrative, reflective, human' },
  { value: 'viral', description: 'punchy, hook-driven, energetic' },
]

type ToneSelectorProps = {
  value: ToneOption
  onChange: (value: ToneOption) => void
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="space-y-2">
      <Label htmlFor="tone-select" className="text-sm font-medium">
        Tone
      </Label>
      <select
        id="tone-select"
        value={value}
        onChange={(event) => onChange(event.target.value as ToneOption)}
        className="h-11 w-full rounded-xl border border-input bg-input/20 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value}
          </option>
        ))}
      </select>
      <p className="text-xs leading-5 text-muted-foreground">
        {selectedOption?.description}
      </p>
    </div>
  )
}
