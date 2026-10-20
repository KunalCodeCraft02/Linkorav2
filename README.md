# Linkora

**A link-in-bio and mini-website builder.** Pick one of fourteen hand-designed
templates, edit every block in a live three-panel editor, and publish to a
public URL that anyone can visit without an account.

- **14 templates** across 10 categories — creator, developer, freelancer,
  business, product launch, artist, musician, coach, restaurant, event.
- **10 theme presets**, each individually customisable, all sharing one token
  system rather than one stylesheet per template.
- **A real editor**: click to select, drag to reorder, edit text, images,
  buttons, social links, colours and spacing with a context-sensitive
  inspector. Undo, redo, autosave, and a live mobile/desktop preview.
- **Real publishing**: a unique public URL, a published snapshot that does not
  change until you publish again, and full ownership isolation.

---

## Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [The shared schema](#the-shared-schema)
- [Templates](#templates)
- [Themes](#themes)
- [The editor](#the-editor)
- [API](#api)
- [Data model](#data-model)
- [Configuration](#configuration)
- [Verification](#verification)
- [Known limitations](#known-limitations)

---

## Quick start

You need **Node.js 20+** and a running **MongoDB** (a local `mongod` is
fine).

```bash
# 1. Backend
cd Backend
npm install
cp .env.example .env      # then edit .env and set JWT_SECRET
npm run dev               # http://localhost:5000

# 2. Frontend (in a second terminal)
cd Frontend
npm install
npm run dev               # http://localhost:5173
```

Then open <http://localhost:5173>, sign up, and go to **Templates**.

To generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Production build

```bash
cd Frontend && npm run build      # emits Frontend/dist
cd Backend  && npm start
```

The backend serves the API and the uploaded assets. Point a web server at
`Frontend/dist` for the browser app and set `FRONTEND_ORIGIN`,
`FRONTEND_PUBLIC_URL` and `BACKEND_PUBLIC_URL` to the real origins.

---

## Architecture

```
Linkora/
├── shared/                     # used by BOTH the frontend and the backend
│   ├── website-schema.mjs      # the document schema + the validation specs
│   ├── templates.mjs           # the 14 template definitions
│   ├── themes.mjs              # the 10 theme presets + token resolution
│   ├── resolve.mjs             # document -> resolved design tokens
│   └── inspector.mjs           # per-element property specs for the editor
│
├── Backend/                    # Node + Express + Mongoose (CommonJS)
│   ├── src/
│   │   ├── server.js           # app wiring
│   │   ├── config/             # env + database
│   │   ├── models/             # User, Website
│   │   ├── controllers/        # authController, websiteController
│   │   ├── routes/             # authRoutes, websiteRoutes
│   │   ├── middleware/         # requireAuth, rate limiters, upload, errors
│   │   └── services/           # slugService
│   └── scripts/                # the verification suites (see below)
│
└── Frontend/                   # React + Vite (JavaScript, JSX)
    └── src/
        ├── pages/              # landing, auth, dashboard, templates,
        │                       # builder, preview, public website
        ├── editor/             # the editor's building blocks
        │   ├── EditorCanvas.jsx    # the live canvas + drag and drop
        │   ├── LeftSidebar.jsx     # blocks, templates, themes, settings
        │   ├── InspectorPanel.jsx  # the right-hand property panel
        │   ├── SettingsPanel.jsx   # site-wide theme and SEO settings
        │   ├── ImageField.jsx      # upload / replace / crop
        │   ├── useDocumentHistory.js  # the document + undo/redo
        │   └── useAutosave.js         # debounced, race-safe saving
        └── components/         # sections, icons, renderers
```

The `shared/` directory is the important part. It sits next to the frontend
rather than inside it, so the CommonJS backend and the ESM Vite app import
**the same** schema, template registry and theme presets. There is one source
of truth for what a document looks like, and the editor cannot drift away
from what the server accepts.

> `shared/*.mjs` files are ES modules. The CommonJS backend loads them with
> `require(esm)`, which Node 20.19+ / 22.12+ supports natively.

---

## The shared schema

Every website is one document with a stable shape:

```js
{
  name: 'My site',
  slug: 'my-site-3f9a21',
  site: {
    templateId: 'aurora',
    themeId: 'minimal-light',
    layout: 'stack',
    colors: { accent: '#ff0066' },   // overrides only
    typography: {},
    background: {},
    contentWidth: 540,
    spacingScale: 1,
    radius: 18,
    buttonPreset: 'solid',
    socialIconStyle: 'pill',
    shadow: 'soft',
  },
  profile: { name, headline, bio, image, email, phone, location, avatarShape },
  sections: [
    { id: 'profile-abc-1', type: 'profile', props: { ... } },
    // ...
  ],
}
```

**Section types** (all eleven are supported end to end):

`profile` · `text` · `image` · `link-button` · `social-links` ·
`link-card` · `gallery` · `video` · `contact` · `divider` · `spacer`

Section IDs are **stable** and independent of their position in the array, so
reordering never invalidates a selection, an undo step, or a saved draft.

### One specification, two consumers

`shared/website-schema.mjs` declares each property once, as a spec:

```js
text:   { kind: 'text',   label: 'Body text',    max: 400 },
accent: { kind: 'color',  label: 'Accent' },
image:  { kind: 'image',  label: 'Photo' },
```

That single declaration is used in two places:

- the **server** turns it into a validator, and coerces every incoming value
  into the declared type before it reaches MongoDB;
- the **editor** turns it into the inspector, so the panel shows exactly the
  controls that apply to the selected element and nothing else.

There is no second list of properties to keep in sync, and no way for the
panel to offer a control the server would reject.

---

## Templates

Fourteen templates, ten categories, two per category where the brief asks
for a second take:

| Category | Templates |
| --- | --- |
| Creator & Influencer | Aurora, Prism |
| Developer & Portfolio | DevGrid, Monorepo |
| Freelancer & Personal Brand | Atelier, Studio Nine |
| Business & Agency | Northwind |
| Product Launch & Startup | Launchpad |
| Artist & Photographer | Aperture |
| Musician & Entertainment | Nocturne |
| Coach & Consultant | Mentor |
| Restaurant & Local Business | Hearth |
| Event & Community | Gathering, Compass |

Choosing a template creates a website **seeded from that template's default
document**. Everything in it is then fully editable — the template is only a
starting point, never a lock. Switching template later asks for
confirmation first and keeps the content that is compatible with the new
template.

Template images are generated locally as SVG data, so there are no broken
remote image URLs and no dependency on a third-party image host. Users can
replace any of them with their own upload.

---

## Themes

Ten presets, named exactly as the brief specifies:

Minimal light · Editorial · Dark studio · Soft pastel · Bold creator ·
Modern business · Retro pop · Elegant monochrome · Warm earthy ·
Neon night

Each preset is a coordinated set of colours, typography, button treatment,
borders, backgrounds, radii and spacing. Selecting a preset **clears** your
colour and typography overrides rather than freezing the preset's values
into the document, which keeps the preset the single source of truth for the
palette. Any individual value can then be overridden on top.

Tokens are resolved once in `shared/resolve.mjs` and applied as CSS custom
properties (`--lx-accent`, `--lx-heading-font`, `--lx-radius`, `--lx-scale`,
…) on the canvas. There is one stylesheet for all templates, not one
stylesheet per template.

---

## The editor

`/editor/:websiteId` — three panels, with the canvas dominant.

**Left sidebar** — Blocks (add any of the eleven types), Templates, Themes,
and Settings. Also a searchable block palette, so you can find a block by
name instead of scrolling.

**Centre canvas** — the live page, rendered with the *same* components the
published page uses, so the editor and the published site cannot disagree.
- Mobile / tablet / desktop frames, and a zoom control
- Click any block to select it; the selection is outlined and the inspector
  switches to it
- Every block has a drag handle, plus Move up / Move down / Duplicate /
  Delete buttons
- Drag and drop is powered by **dnd-kit** — pointer and keyboard sensors,
  so a block can be reordered with the space bar and the arrow keys

**Right inspector** — changes with the selection. A text block offers text,
alignment, font and colour; a gallery offers image upload and reordering; a
link button offers its label, destination URL and style. The panel never
shows controls that do not apply to what is selected.

**Saving** — an explicit indicator that reads *All changes saved*,
*Unsaved changes*, *Saving*, *Saved* or *Save failed — retry*. Changes are
autosaved after a short debounce, and flushed when the tab is hidden or
closed. A slow request can never overwrite a newer edit: every edit carries a
token, and a response only clears the queue if its token is still current.
The document is also compared against the last-known server state, so an
edit that changes nothing does not trigger a pointless write, and undoing
back to the saved state correctly reports "all saved".

**Undo / redo** — 60 steps deep, with consecutive edits to the *same*
property coalesced into a single step (typing a sentence is one undo, not
one per keystroke). `Ctrl/Cmd+Z` and `Ctrl/Cmd+Shift+Z` work anywhere in the
editor.

---

## API

Base path: `/api`.

### Public

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/websites/catalog` | the template and theme catalogue. No session needed. |
| `GET` | `/api/websites/public/:slug` | the published snapshot. No session needed. |
| `GET` | `/api/health` | liveness, and the database connection status. Never leaks a secret. |

### Authenticated

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | creates a user, sets the session cookie |
| `POST` | `/api/auth/login` | sets the session cookie |
| `GET` | `/api/auth/me` | the current user |
| `POST` | `/api/auth/logout` | clears the cookie |
| `GET` | `/api/websites` | the signed-in user's websites only |
| `POST` | `/api/websites` | create from a template |
| `GET` | `/api/websites/:id` | read one |
| `PATCH` | `/api/websites/:id` | update (partial, validated) |
| `POST` | `/api/websites/:id/publish` | snapshot and publish |
| `POST` | `/api/websites/:id/unpublish` | take it down |
| `POST` | `/api/websites/:id/duplicate` | copy it |
| `DELETE` | `/api/websites/:id` | delete it |
| `POST` | `/api/websites/:id/assets` | upload an image |

Every authenticated route takes the owner from the **session**, never from
the request body. A user who guesses another user's website ID gets a `404`,
not their data. Publishing, editing, duplicating and deleting all check
ownership.

Authentication and uploads are rate limited. The upload limit validates the
file by its **magic bytes**, not by the extension or the browser-supplied
MIME type, and stores the asset on disk with a generated name — the
user's filename is never used as a path.

### Frontend routes

| Path | Purpose |
| --- | --- |
| `/` | landing page |
| `/register`, `/login` | auth |
| `/home` | dashboard — my websites |
| `/templates` | the template browser |
| `/editor/:websiteId` | the editor |
| `/preview/:websiteId` | a full-page preview of the draft |
| `/p/:slug` | the **public** page for a published website |

---

## Data model

### `User`

`firstName` · `email` (unique) · `phone` · `instagram` · `followers` ·
`passwordHash` · timestamps. Unchanged by the rebuild.

### `Website`

| Field | Notes |
| --- | --- |
| `owner` | `ObjectId` → `User`, indexed. Taken from the session. |
| `name` | the site's title in the dashboard |
| `slug` | unique, lowercase, URL-safe. Indexed. |
| `status` | `draft` or `published`. Indexed. |
| `site` | theme, layout, overrides, spacing, radius, button and social presets |
| `profile` | name, headline, bio, image, email, phone, location, avatar shape |
| `sections` | the editable document, in display order |
| `publishedSite` / `publishedProfile` / `publishedSections` | the **snapshot** taken at publish time |
| `publishedAt` | when it was published |
| `timestamps` | `createdAt` / `updatedAt` |

The published snapshot is why the public page is stable: the public route
serves `publishedSections`, never the live document. Editing a draft does
not change what visitors see until you publish again.

Indexes: `{ owner: 1, updatedAt: -1 }`, `{ slug: 1, status: 1 }`, plus the
unique index on `slug` and on `User.email`.

### `shared/website-schema.mjs` — the validation

The server coerces every incoming value against the shared spec before it
reaches MongoDB: wrong types are coerced or dropped, unknown properties are
stripped, strings are length-checked, colours are pattern-checked, URLs are
checked, and the section `type` must be one of the eleven. A malformed
request gets a `400` with a readable message rather than a corrupt
document.

---

## Configuration

### `Backend/.env`

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | no | `5000` | the API port |
| `MONGODB_URI` | no | `mongodb://127.0.0.1:27017/linkora` | the database |
| `JWT_SECRET` | **yes** | — | signs the session cookie. ≥ 32 characters. |
| `FRONTEND_ORIGIN` | no | `http://localhost:5173` | the only CORS origin allowed to send credentials |
| `FRONTEND_PUBLIC_URL` | no | the origin above | where the browser app lives; used to build public URLs |
| `BACKEND_PUBLIC_URL` | no | `http://localhost:5000` | where the API lives; used to build absolute asset URLs |
| `MAX_UPLOAD_BYTES` | no | `5242880` | the per-image upload limit (5 MB) |
| `AUTH_RATE_LIMIT` | no | `20` in production, `200` otherwise | auth attempts per 15 minutes |

> Only `VITE_`-prefixed variables reach the browser bundle. `JWT_SECRET`
> never does.

### `Frontend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` | where the API is |

---

## Verification

Six suites, all of which run against the **real** server and the **real**
MongoDB — no mocks and no stubbed responses.

```bash
cd Backend
npm run check:integration   # 36 checks - the whole API, end to end
npm run check:browser-flow  # 16 checks - the same flow through a browser session
npm run check:editor-ui     # 46 checks - drives the real editor in a real browser
npm run check:templates     # 30 checks - every template and every theme renders
npm run check:legacy        # 8 checks - websites made before the rebuild still read
npm run check:landing       # 27 checks - the landing page tells the truth
```

The suites that talk to an already-running server default to
`http://localhost:5000`. Point them somewhere else with
`LINKORA_BACKEND` — useful when port 5000 is already taken:

```bash
LINKORA_BACKEND=http://localhost:5098 npm run check:editor-ui
```

The two browser suites need Playwright:

```bash
cd Backend
npm install --save-dev playwright
npx playwright install chromium
```

If the bundled Chromium is not available, the scripts fall back to the
system Chrome automatically.

**`check:integration`** covers registration and sessions, the http-only
cookie, the public catalogue, creating a website from a template, section
validation, editing, slug uniqueness and collision handling, asset upload
and its magic-byte rejection, publish/unpublish, public rendering without a
session, unpublished pages being absent, and ownership isolation for read,
edit, publish and delete.

**`check:browser-flow`** walks the same journey through a cookie-authenticated
browser session: register, load the catalogue without a session, create from
a template, edit, reorder, upload an image, publish, load the public URL and
confirm the published page carries no editor chrome.

**`check:editor-ui`** drives the actual interface with Playwright: sign up,
check the dashboard's empty state, browse and filter the templates, open the
detail modal, create from a template, confirm the three-panel layout,
confirm the inspector changes with the selection, edit a text block and
watch it appear on the canvas, upload a profile photo and confirm it lands
on the profile's own `image` property, upload a video poster and confirm it
lands on `poster` without replacing the video's `url`, change the accent
colour, add a block, move a
block up, **drag a block to a new position with the mouse**, undo, redo,
confirm the save indicator reports unsaved changes while an edit is queued
and settles on "saved" afterwards, reload and confirm the order, the text
and the new block all survived, publish, open the public URL and confirm the
content and the colour, unpublish and confirm it is gone — and finally
confirm the console stayed clean.

**`check:templates`** creates a website from each of the fourteen templates
and confirms the editor renders it, then applies each of the ten themes and
confirms the resolved accent and heading font change.

**`check:legacy`** signs a session for the owner of a website that was
created before the rebuild and confirms their content is still there, in the
current section vocabulary, with stable ids.

**`check:landing`** loads the landing page and confirms it renders without
console errors, that every in-page link and call to action points somewhere
that exists, that the template, theme and category counts match the live
catalogue, and that it does not advertise anything the app does not do —
there is no click analytics, no AI coach, no A/B testing and no paid plan,
because none of those exist.

### Two optional maintenance scripts

```bash
npm run migrate:legacy                  # write the migration back to MongoDB
npm run migrate:legacy -- --dry-run     # report what would change
npm run cleanup:removed-collections     # drop the Figma/Groq collections
```

Websites created before the rebuild are **upgraded on read**, so the app
works without running anything. `migrate:legacy` is only needed to write
that upgrade back to the database so the old shape stops lingering. The
`generationjobs` and `exporttokens` collections belong to the removed Figma
and Groq features; no code reads them any more, and
`cleanup:removed-collections` drops them. Neither script runs automatically.

---

## Known limitations

- **No email verification or password reset.** Authentication is a local
  email + password with a session cookie. Both are needed for a real
  deployment.
- **Uploaded files are stored on local disk** in `Backend/uploads/`. The
  upload middleware is isolated behind one function, so swapping in S3 or
  any object store is a contained change — but it has not been done.
- **The public page is server-rendered by React** from a JSON API, not from
  static HTML. It is fast and works, but a high-traffic site would want
  pre-rendered pages.
- **No real-time collaboration.** Two people editing the same site at the
  same time will have their changes race, last write winning.
- **The template images are generated placeholders.** They are polished and
  replaceable, but they are not photographs of real places or people.
- **There is no custom domain support.** Published sites live at
  `/p/:slug` on the configured frontend origin.
#   L i n k o r a v 2  
 #   L i n k o r a v 2  
 