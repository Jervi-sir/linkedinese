# Linkedinese 🚀

**Linkedinese** is a minimalist, AI-powered writing studio designed to turn your rough notes, bullet points, or half-formed thoughts into polished, professional LinkedIn posts. 

Gone are the days of staring at a blank screen. Just dump your thoughts, choose your vibe, and let AI do the heavy lifting.

![Linkedinese Banner](https://images.unsplash.com/photo-1611944212129-29977ae1398c?q=80&w=2000&auto=format&fit=crop)

---

## ✨ Features

- **Brain Dump to Post**: Convert messy notes or voice recordings into structured LinkedIn content.
- **Voice Integration**: Don't feel like typing? Use the built-in voice-to-text feature to "talk" your post into existence.
- **Customized Tone & Length**: 
  - **Tones**: Professional, Casual, Inspiring, or Provocative.
  - **Length**: Short (Punchy), Medium (Standard), or Long (Deep Dive/Story).
- **Dark Mode by Default**: A sleek, premium dark-themed interface designed for focused writing.
- **Live Preview**: See your generated post instantly and copy it with a single click.

## 🔒 Privacy & Security First

Your data belongs to you. Linkedinese is built with a **local-first** approach to security:

- **Local API Storage**: Your Google Gemini API key is stored **exclusively in your browser's local storage**. 
- **Hashing/Obfuscation**: For an extra layer of security, your key is hashed/obfuscated locally so it's not stored as plain text.
- **No Middleman**: Your requests go directly from your browser to the Google Gemini API. Your key is **never** sent to any third-party server or backend.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Hugeicons](https://hugeicons.com/)
- **AI Engine**: [Google Gemini Pro API](https://ai.google.dev/)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/linkedinese.git
   cd linkedinese
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal).

## 💡 How to Use

1. **Add your API Key**: Click on the API key field and paste your Google Gemini key. It will be saved locally for future sessions.
2. **Draft your Post**: Type your thoughts in the "Writing Studio" or click the microphone icon to speak.
3. **Select Options**: Choose your preferred tone (e.g., *Inspiring*) and length (e.g., *Medium*).
4. **Generate**: Click **"Generate Post"**.
5. **Copy & Publish**: Your polished post will appear on the right. Copy it and paste it directly to LinkedIn!

---

Built with ❤️ by [Your Name/Jervi]
