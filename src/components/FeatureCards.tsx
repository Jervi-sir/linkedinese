import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const cards = [
  {
    title: 'Capture messy thinking',
    text: 'Drop in rough paragraphs, bullet points, or fragments that are still finding their shape.',
  },
  {
    title: 'Speak instead of typing',
    text: 'Use browser speech-to-text, watch the transcript live, and push it directly into the composer.',
  },
  {
    title: 'Tune the finish',
    text: 'Pick tone, length, and Gemini model before generating a LinkedIn-ready version.',
  },
]

export function FeatureCards() {
  return (
    <div className="grid gap-4 md:grid-cols-1">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className="rounded-[1.5rem] border border-border/60 bg-card/80 py-0 backdrop-blur"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <CardHeader className="px-5 pt-5">
            <CardTitle className="font-heading text-xl">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 text-sm leading-6 text-muted-foreground">
            {card.text}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
