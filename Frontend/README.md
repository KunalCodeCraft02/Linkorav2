# Linkora frontend

The browser app: the landing page, the auth screens, the dashboard, the
template browser, the editor, the preview, and the public page.

React 19 + Vite, written in JavaScript with JSX. No TypeScript.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # emits dist/
npm run lint
```

## Configuration

Copy `.env.example` to `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Only `VITE_`-prefixed variables are exposed to the browser bundle. Never put
a secret here.

## Layout

```
src/
├── App.jsx                 # the router and the landing page
├── pages/
│   ├── DashboardPage.jsx   # my websites
│   ├── TemplatesPage.jsx   # the template browser
│   ├── BuilderPage.jsx     # the editor (/editor/:websiteId)
│   ├── PreviewPage.jsx     # a full-page preview of the draft
│   └── PublicWebsitePage.jsx  # the public page (/p/:slug)
├── editor/                 # the editor's building blocks
│   ├── EditorCanvas.jsx    # the live canvas + drag and drop (dnd-kit)
│   ├── LeftSidebar.jsx     # blocks, templates, themes
│   ├── InspectorPanel.jsx  # the context-sensitive property panel
│   ├── SettingsPanel.jsx   # site-wide theme and SEO settings
│   ├── ImageField.jsx      # upload / replace / remove images
│   ├── useDocumentHistory.js  # the document + undo/redo
│   └── useAutosave.js         # debounced, race-safe saving
├── components/
│   ├── sections.jsx        # the eleven section renderers
│   ├── WebsiteRenderer.jsx # renders a whole document
│   ├── TemplatePreview.jsx # the template thumbnails
│   └── icons.jsx           # the icon set
├── lib/api.js              # fetch wrapper + the session cookie handling
├── App.css / Builder.css / Editor.css / Sections.css
```

## The shared directory

`../shared/` holds the schema, the templates, the themes and the inspector
specs. It is shared with the backend, so the editor and the API can never
disagree about what a website is. Vite is configured to read it
(`vite.config.js` sets `fs.allow`).

## Styles

The app uses plain CSS with custom properties, not a CSS framework. The
theme tokens resolve to CSS variables on the canvas (`--lx-accent`,
`--lx-heading-font`, `--lx-radius`, `--lx-scale`, …), which is what lets
all fourteen templates share one stylesheet.

`Editor.css` scopes its `.chip` and similar rules to the editor, dashboard
and template pages, so the landing page's own styles keep working.
