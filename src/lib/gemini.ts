import type { LengthOption } from '@/components/LengthSelector'
import type { ToneOption } from '@/components/ToneSelector'

export const presetModels = [
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]

type GenerateLinkedInPostParams = {
  apiKey: string
  input: string
  model: string
  tone: ToneOption
  length: LengthOption
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message?: string
  }
}

const systemInstruction = [
  'You transform rough user thoughts into polished LinkedIn posts.',
  'Preserve the original meaning.',
  'Improve clarity, rhythm, and flow.',
  'Use readable short paragraphs.',
  'Avoid cliches and generic AI phrasing.',
  'Avoid hashtags unless the user explicitly asks for them.',
  'Avoid unnecessary emojis.',
  'Return only the final post.',
].join(' ')

export function getDefaultModel() {
  return presetModels[0]
}

export async function generateLinkedInPost({
  apiKey,
  input,
  model,
  tone,
  length,
}: GenerateLinkedInPostParams) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const prompt = [
    `Tone: ${tone}`,
    `Length: ${length}`,
    'Rewrite the following rough input into a polished LinkedIn post:',
    input,
  ].join('\n\n')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }),
  })

  const data = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini request failed.')
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()

  if (!text) {
    throw new Error('Gemini returned an empty response.')
  }

  return text
}
