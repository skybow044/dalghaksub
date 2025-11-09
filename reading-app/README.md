# Reading App

A local-first bilingual lecture transcript reader inspired by Notion and Readwise. Load `.txt` or `.json` transcripts, highlight important sections, and manage summaries with automatic RTL/LTR direction and theme switching.

## Features

- ⚡️ Vite + React + TypeScript + Tailwind CSS UI
- 🌗 Dark and light themes with smooth typography
- 🌍 English and Persian interface with automatic direction changes
- 📁 Local file loading for transcripts (`.txt` and `.json`)
- 📝 Persistent highlights and manual summary management
- 📊 Reading progress indicator tied to scroll position

## Getting started

### Prerequisites

- Node.js 18 or newer (includes npm)

### Installation

```bash
npm install
```

> If you are working in an offline or firewalled environment, configure npm to reach the public registry or use an internal mirror before installing dependencies.

### Development server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173). Use the **Load document** button to select a local transcript. Toggle the language to switch between English (LTR) and Persian (RTL) layouts.

### Production build

```bash
npm run build
npm run preview
```

## Project structure

```
reading-app/
├─ public/
├─ src/
│  ├─ components/
│  ├─ hooks/
│  ├─ i18n/
│  ├─ store/
│  ├─ styles/
│  └─ utils/
├─ index.html
├─ package.json
├─ tailwind.config.cjs
└─ vite.config.ts
```

## Loading transcripts

- **Text files:** Each paragraph is separated by one or more blank lines.
- **JSON files:** Supports `{ "text": "..." }`, `{ "paragraphs": ["..."] }`, or a raw array of paragraphs.

## Persisted data

- Highlights and summaries are stored in `localStorage` to keep your notes between sessions.
- Theme and language preferences are remembered across reloads.

## Customization ideas

- Integrate Whisper or other speech-to-text tools via a local FastAPI service.
- Synchronize highlights with spaced-repetition tools.
- Add AI summarization via OpenAI or Hugging Face APIs.

## License

MIT
