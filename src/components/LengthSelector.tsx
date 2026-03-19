import { Label } from '@/components/ui/label'

export type LengthOption = 'short' | 'medium' | 'long'

const options: Array<{ value: LengthOption; description: string }> = [
  { value: 'short', description: 'tight and concise' },
  { value: 'medium', description: 'balanced detail' },
  { value: 'long', description: 'more context and depth' },
]

type LengthSelectorProps = {
  value: LengthOption
  onChange: (value: LengthOption) => void
}

export function LengthSelector({ value, onChange }: LengthSelectorProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="space-y-2">
      <Label htmlFor="length-select" className="text-sm font-medium">
        Length
      </Label>
      <select
        id="length-select"
        value={value}
        onChange={(event) => onChange(event.target.value as LengthOption)}
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
