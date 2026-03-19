# React + shadcn/ui Feature Reference

Use this file as the source of truth when rebuilding the app in plain React with shadcn/ui.

## Product Goal

Build a writing studio that turns rough text or voice notes into polished LinkedIn posts using Gemini.

## Keep These Features

### 1. Landing Page
- Hero section with product headline and short value proposition
- CTA to enter the writing studio
- Small feature cards explaining the product
- Preview card showing raw thought -> generated post transformation

### 2. Dashboard / Studio
- Main composer area for writing raw input
- Output area for generated LinkedIn post
- Signed-in user system is NOT required for rebuild
- The studio can be opened directly without Google OAuth

### 3. Text Input
- Large textarea for raw draft input
- Placeholder explaining what kind of input to write
- Clear input action
- Minimum input length check before generation

### 4. Voice Input
- Browser speech-to-text using Web Speech API
- Separate `Listen` and `Pause` buttons
- Live listening state indicator
- Live transcript preview while speaking
- Transcript inserted into the main textarea
- Friendly error when browser speech recognition is unavailable

### 5. Gemini API Key Handling
- User pastes Gemini API key in the UI
- API key stored in `localStorage`
- No backend auth required
- Key is required before generating

Suggested storage key:
- `linkedinese_gemini_api_key`

### 6. Gemini Model Selection
- Preset selectable model tags/buttons
- Custom model text input if model is not in presets
- Selected model saved in `localStorage`

Current preset models:
- `gemini-2.5-flash`
- `gemini-2.5-pro`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`

Suggested storage key:
- `linkedinese_gemini_model`

### 7. Generation Flow
- On submit, call Gemini `generateContent`
- Send:
  - raw input
  - selected tone
  - selected length
  - system prompt for LinkedIn rewriting
- Show loading state while generating
- Show response in output panel
- Show API error message if request fails

Current request shape:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}`
- Method: `POST`

### 8. Tone Selector
Support these tone options:
- `professional`
- `storytelling`
- `viral`

### 9. Length Selector
Support these length options:
- `short`
- `medium`
- `long`

### 10. Output Panel
- Display generated LinkedIn post
- Copy to clipboard button
- Regenerate button
- Empty state before first generation

### 11. Theme Toggle
- Light theme
- Dark theme
- Persist selected theme in `localStorage`

Suggested storage key:
- `linkedinese_theme`

## Current Prompt Behavior

System behavior should be equivalent to this:

- Transform raw user thoughts into polished LinkedIn posts
- Preserve meaning
- Improve clarity and flow
- Use readable short paragraphs
- Avoid cliches and generic AI tone
- Avoid hashtags unless explicitly requested
- Avoid unnecessary emojis
- Return only the final post

## Local Storage Keys To Preserve

- `linkedinese_gemini_api_key`
- `linkedinese_gemini_model`
- `linkedinese_theme`

## Features To Remove In Rebuild

- Google OAuth / Google Identity Services
- Stored Google profile/session
- Any route protection based on login

## Recommended React + shadcn/ui Structure

### Pages / Views
- `HomePage`
- `StudioPage`

### Core Components
- `ThemeToggle`
- `FeatureCards`
- `StudioComposer`
- `VoiceControls`
- `ModelSelector`
- `ApiKeyField`
- `ToneSelector`
- `LengthSelector`
- `GeneratedOutput`

### Utility Modules
- `lib/gemini.ts`
- `lib/storage.ts`
- `lib/speech.ts`
- `lib/theme.ts`

## Nice-to-Have Notes

- Keep the DM Sans + Fraunces font pairing if desired
- Use shadcn `Card`, `Button`, `Input`, `Textarea`, `Badge`, `Select`, `Separator`, `Alert`
- Prefer client-side flow only unless you later move Gemini calls behind your own backend
