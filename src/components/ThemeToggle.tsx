import { Switch } from '@/components/ui/switch'

type ThemeToggleProps = {
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const checked = theme === 'dark'

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-full border border-border/70 bg-background px-3 py-2 text-sm">
      <span>{checked ? 'Dark' : 'Light'}</span>
      <Switch checked={checked} onCheckedChange={(next) => onThemeChange(next ? 'dark' : 'light')} />
    </label>
  )
}
