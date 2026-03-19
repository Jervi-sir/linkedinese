import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ApiKeyFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function ApiKeyField({ value, onChange }: ApiKeyFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="gemini-api-key" className="text-sm font-medium">
        Gemini API key
      </Label>
      <Input
        id="gemini-api-key"
        type="password"
        autoComplete="off"
        placeholder="Paste your Gemini API key"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-xl px-3 text-sm"
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Saved only in your browser. Get yours at{" "}
        <a
          href="https://aistudio.google.com/app/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          Google AI Studio
        </a>
      </p>
    </div>
  )
}
