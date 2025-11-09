1️⃣ **Concept overview**
- Build a local-first reading hub that mimics the browsing comfort of home media apps like Plex, tailored for lecture transcripts and summaries.
- Users curate a personal library by importing `.txt` transcripts or copy-pasting notes; each entry features cover art, title, short summary, tags, and source link.
- Modern dark-mode UI emphasizes smooth typography, bilingual support (Persian RTL & English LTR), and inline expansion of summaries without leaving the grid view.
- Readers can mark favorites or completed items, helping track learning progress while keeping everything offline.

2️⃣ **UI layout sketch (text-based)**
```
┌───────────────────────────────────────────────────────────┐
│ Header: Logo / Title ┆ Search ┆ Language toggle ┆ Settings │
├───────────────────────────────────────────────────────────┤
│ Filter row: Tags chips ┆ Sort dropdown ┆ "Add transcript"  │
├───────────────────────────────────────────────────────────┤
│ LibraryGrid (responsive cards 3-5 per row)                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Cover img    │  │  Cover img    │  │  Cover img    │   │
│  │  Title        │  │  Title        │  │  Title        │   │
│  │  Summary chip │  │  Summary chip │  │  Summary chip │   │
│  │  Tags + icons │  │  Tags + icons │  │  Tags + icons │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                           │
│  ▼ On card click, it expands inline between rows:         │
│  ┌───────────────────────────────────────────────────────┐│
│  │ Summary (inline)                                      ││
│  │ ──────────────────────────────────────────────────── ││
│  │ Reader pane: scrollable, sticky controls (progress,  ││
│  │ font size, mark as read/favorite).                   ││
│  └───────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────┘
Footer: Progress overview ┆ Storage info ┆ Version
```

3️⃣ **Design system (colors, fonts, spacing)**
- **Color palette (dark-first):**
  - Background: `#0F172A` (deep slate) / `#111827` fallback
  - Surface panels: `#1E293B`
  - Card hover: `#273449`
  - Primary accent: `#38BDF8` (sky) for interactive elements
  - Secondary accent: `#F97316` for highlights/favorites
  - Text primary: `#F8FAFC`, secondary: `#CBD5F5`, muted: `#64748B`
  - Success/read state: `#22C55E`; Warning/unread: `#FACC15`
- **Typography:**
  - Latin: "Inter", "Work Sans"; Persian: "IRANSansX", "Vazirmatn"
  - Body size 16px base, 1.6 line-height; headings 24/32/40px scale
- **Spacing & layout:**
  - Base unit 8px; cards use 16px padding, grid gap 24px desktop, 16px tablet
  - Border radius 16px for cards, 12px for buttons; subtle 0 12px 32px shadow
- **Motion:**
  - Transitions 180ms ease-out for hover/focus, 320ms for expansion
  - Use Tailwind `transition-all` with `ease-out` and `transform` for scale subtlety

4️⃣ **Component breakdown + code snippets**
- **Stack recommendation:** React + Vite + TypeScript + Tailwind CSS. Runs entirely in browser, no backend required. Use Zustand for state, `i18next` for bilingual support.
- **Core components:**
  - `AppShell`: header, filter controls, `LibraryGrid`
  - `LibraryGrid`: responsive layout of `LibraryCard`s
  - `LibraryCard`: displays cover, title, summary chip, metadata icons; manages expand state
  - `InlineReader`: collapsible panel with summary + full transcript, uses `AutoDirectionText`
  - `AutoDirectionText`: detects language (basic regex or `franc-min`) and applies `dir="rtl"/"ltr"`
  - `SettingsDrawer`: theme/font size/favorite filters
  - `FileImporter`: handles manual file uploads or text paste dialog
  - `TagFilter`, `MarkToggle`

```tsx
// src/components/LibraryCard.tsx
import { useState } from 'react';
import { AutoDirectionText } from './AutoDirectionText';
import { InlineReader } from './InlineReader';

export const LibraryCard = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`group rounded-2xl bg-surface/80 backdrop-blur border border-slate-700/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500/80 ${
        expanded ? 'ring-2 ring-sky-400/40' : ''
      }`}
    >
      <button
        className="w-full text-left p-5 flex gap-4"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <img src={item.cover} alt="cover" className="h-24 w-24 rounded-xl object-cover shadow" />
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-slate-50">{item.title}</h3>
          <p className="text-sm text-slate-300 line-clamp-2">
            <AutoDirectionText text={item.caption} />
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-800/70 px-3 py-1">
                #{tag}
              </span>
            ))}
            {item.videoUrl && (
              <a
                href={item.videoUrl}
                className="ml-auto text-sky-300 hover:text-sky-200"
                target="_blank"
                rel="noreferrer"
              >
                ↗︎
              </a>
            )}
          </div>
        </div>
      </button>
      {expanded && <InlineReader item={item} />}
    </article>
  );
};
```

```tsx
// src/components/InlineReader.tsx
import { useMemo } from 'react';
import { AutoDirectionText } from './AutoDirectionText';
import { useLibraryStore } from '../store/libraryStore';

export const InlineReader = ({ item }) => {
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const markRead = useLibraryStore((s) => s.markRead);
  const isFavorite = useLibraryStore((s) => s.favorites.has(item.id));
  const isRead = useLibraryStore((s) => s.read.has(item.id));

  const paragraphs = useMemo(() => item.content.split(/\n{2,}/), [item.content]);

  return (
    <div className="px-6 pb-6 space-y-4 border-t border-slate-700/70 bg-slate-900/80">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-slate-100 text-base font-semibold">
          <AutoDirectionText text={item.caption} />
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => toggleFavorite(item.id)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              isFavorite ? 'bg-orange-500/20 text-orange-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            ★
          </button>
          <button
            onClick={() => markRead(item.id)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              isRead ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            ✓
          </button>
        </div>
      </div>
      <section className="space-y-3 text-slate-200 leading-relaxed max-h-96 overflow-y-auto pr-2">
        {paragraphs.map((block, idx) => (
          <p key={idx} className="whitespace-pre-wrap">
            <AutoDirectionText text={block} />
          </p>
        ))}
      </section>
    </div>
  );
};
```

```ts
// src/hooks/useLocalTextLoader.ts
export const useLocalTextLoader = () => {
  const addItem = useLibraryStore((s) => s.addItem);

  const handleFilePick = async () => {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'Text files', accept: { 'text/plain': ['.txt'] } }],
      multiple: false,
    });
    const file = await fileHandle.getFile();
    const text = await file.text();
    addItem({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.txt$/, ''),
      caption: text.slice(0, 200),
      content: text,
      tags: [],
      cover: 'placeholder.jpg',
    });
  };

  const handleManualPaste = (title, text) => {
    addItem({
      id: crypto.randomUUID(),
      title,
      caption: text.slice(0, 200),
      content: text,
      tags: [],
      cover: 'placeholder.jpg',
    });
  };

  return { handleFilePick, handleManualPaste };
};
```

5️⃣ **Step-by-step setup for running locally**
1. **Create project**
   ```bash
   npm create vite@latest lecture-library -- --template react-ts
   cd lecture-library
   ```
2. **Install dependencies**
   ```bash
   npm install tailwindcss postcss autoprefixer
   npm install zustand i18next react-i18next franc-min classnames
   npm install @headlessui/react @heroicons/react
   ```
3. **Configure Tailwind**
   ```bash
   npx tailwindcss init -p
   ```
   - Set `darkMode: 'class'`, extend colors with palette above, enable typography plugin for reader text.
4. **Set up fonts**
   - Download "Inter" and "Vazirmatn" webfonts; place in `src/assets/fonts/` and reference in `globals.css` with `@font-face` for smooth Persian rendering.
5. **Initialize i18next**
   - Create `src/i18n/index.ts` with English/Persian resources and a helper that toggles `document.dir`.
6. **Build components**
   - Implement `AppShell`, `LibraryGrid`, `LibraryCard`, `InlineReader`, `SettingsDrawer`, `AutoDirectionText` (detect language via `franc-min` or simple regex on Arabic range), `useLocalTextLoader`, `libraryStore` with Zustand.
7. **Add file import & paste support**
   - Use File System Access API for `.txt`; provide fallback `<input type="file">` if API unavailable.
   - Offer modal for manual paste; store entries in `localStorage` via Zustand `persist` middleware.
8. **Run locally**
   ```bash
   npm run dev
   ```
   - Visit `http://localhost:5173`, toggle language to confirm RTL/LTR alignment and dark theme.
9. **Build production bundle**
   ```bash
   npm run build
   npm run preview
   ```
   - Use `npm run preview` for final QA.
10. **Optional packaging**
    - Convert to PWA with `vite-plugin-pwa` if offline caching of assets is desired.
