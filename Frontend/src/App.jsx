import { useEffect, useState } from 'react'
import './App.css'
import './Sections.css'
import './Builder.css'
import './Editor.css'
import DashboardPage from './pages/DashboardPage'
import BuilderPage from './pages/BuilderPage'
import TemplatesPage from './pages/TemplatesPage'
import PreviewPage from './pages/PreviewPage'
import PublicWebsitePage from './pages/PublicWebsitePage'
import { apiRequest, API_URL } from './lib/api'
import { TEMPLATES } from '../../shared/templates.mjs'
import { THEMES } from '../../shared/themes.mjs'
import { SECTION_DEFS } from '../../shared/website-schema.mjs'

const themes = {
  blue: { bg: '#dfe4ff', fg: '#1d1b2e', btn: '#2b3fa0', btnFg: '#fff' },
  rose: { bg: '#ffe0e7', fg: '#3a1020', btn: '#d9506f', btnFg: '#fff' },
  saffron: { bg: '#fff0c4', fg: '#2e2208', btn: '#f2b01e', btnFg: '#2e2208' },
  green: { bg: '#d4efe4', fg: '#0e2a21', btn: '#1f8a6b', btnFg: '#fff' },
}

const links = [
  'Watch the new reel',
  'Print shop',
  'Sketchbook course',
  'Join the WhatsApp class',
  'Instagram',
]

/* The template categories, counted from the real catalogue so the landing
   page can never drift away from what the editor actually offers. */
const SECTION_TYPES = Object.keys(SECTION_DEFS)

const TEMPLATE_COUNT = TEMPLATES.length
const THEME_COUNT = THEMES.length
const CATEGORY_COUNT = new Set(TEMPLATES.map((template) => template.category)).size

/* The small numbers in the copy, so the landing page can never claim a
   count the editor does not actually have. */
const COUNT_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
]
const word = (count) => COUNT_WORDS[count] || String(count)

const CATEGORY_LABELS = {
  'Creator & Influencer': 'Creator',
  'Developer & Portfolio': 'Developer',
  'Freelancer & Personal Brand': 'Freelancer',
  'Business & Agency': 'Business',
  'Product Launch & Startup': 'Launch',
  'Artist & Photographer': 'Artist',
  'Musician & Entertainment': 'Musician',
  'Coach & Consultant': 'Coach',
  'Restaurant & Local Business': 'Restaurant',
  'Event & Community': 'Event',
}

const CATEGORY_BARS = Object.entries(
  TEMPLATES.reduce((counts, template) => {
    counts[template.category] = (counts[template.category] || 0) + 1
    return counts
  }, {}),
)
  .map(([category, count]) => [
    CATEGORY_LABELS[category] || category,
    count,
    Math.round((count / TEMPLATES.length) * 100),
  ])
  .sort((a, b) => b[1] - a[1])
function Logo({ onClick }) {
  return <a className="logo" href="/" onClick={onClick}><i />Linkora</a>
}

function Header({ authenticated = false }) {
  return (
    <nav>
      <div className="wrap nav-inner">
        <Logo />
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#templates">Templates</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        {authenticated ? <a className="btn" href="/register">Start free</a> : <div className="auth-actions"><a className="btn ghost" href="/login">Log in</a><a className="btn" href="/register">Sign up</a></div>}
      </div>
    </nav>
  )
}

function PhonePreview() {
  const [theme, setTheme] = useState('blue')
  const current = themes[theme]

  return (
    <div className="stage">
      <div className="swatches" role="group" aria-label="Try a theme">
        {Object.entries(themes).map(([name, colors]) => (
          <button
            className="sw"
            key={name}
            style={{ background: colors.btn }}
            aria-label={`${name} theme`}
            aria-pressed={theme === name}
            onClick={() => setTheme(name)}
          />
        ))}
      </div>
      <div className="phone">
        <div className="screen" style={{ '--bg': current.bg, '--fg': current.fg, '--btn': current.btn, '--btnfg': current.btnFg }}>
          <div className="avatar" />
          <h3>Meera Kulkarni</h3>
          <p>Illustrator &amp; teacher, Pune</p>
          {links.map((label, index) => (
            <a className={`lnk ${index > 2 ? 'alt' : ''}`} href="#claim" key={label}>
              {label}
            </a>
          ))}
        </div>
      </div>
      <span className="tag hand">tap a colour, it repaints</span>
    </div>
  )
}

function LandingPage({ authenticated = false }) {
  return (
    <>
      <Header authenticated={authenticated} />
      <header className="hero" id="top">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="wrap hero-grid">
          <div>
            <h1><span>One link,</span><span>painted</span><span className="under">your way.<svg viewBox="0 0 300 20" preserveAspectRatio="none"><path d="M4 12 C60 2, 110 18, 170 8 S270 6, 296 12" /></svg></span></h1>
            <p className="lede">Replace the plain link list in your Instagram bio with a page that looks like you made it by hand. Pick a template, edit every block, and publish it to a link you can put anywhere.</p>
            <div className="cta"><a className="btn" href="/register">Claim your link</a><a className="btn ghost" href="#templates">See the templates</a></div>
            <p className="note hand">free forever, no card needed</p>
          </div>
          <PhonePreview />
        </div>
      </header>
      <div className="band"><div>{TEMPLATE_COUNT} templates <i>✦</i> {THEME_COUNT} themes <i>✦</i> Drag-and-drop editor <i>✦</i> Image upload <i>✦</i> One public link <i>✦</i> {TEMPLATE_COUNT} templates <i>✦</i> {THEME_COUNT} themes <i>✦</i></div></div>
      <section id="features"><div className="wrap"><h2>A page with a hand in it, and an editor to match.</h2><p className="sub">Most bio-link tools stop at buttons. Linkora gives you a real page, a real editor, and a public link that works on every screen.</p><div className="grid">
        <article className="card c-a"><h3>Your design, turned into a real page</h3><p>Start from one of {word(TEMPLATE_COUNT)} templates and edit every word, image, colour and button. Linkora rebuilds it as editable blocks you can restyle without writing code.</p><div className="chips">{[`${TEMPLATE_COUNT} templates`, 'Image upload', 'Editable blocks', 'Responsive', 'One public link'].map((item) => <span className="chip" key={item}>{item}</span>)}</div></article>
        <article className="card c-b"><h3>An editor that shows you the truth</h3><p>The canvas is the live page, not a mock-up. Click a block to select it, drag to reorder it, and watch the result on a phone frame as you edit.</p></article>
        <article className="card c-c"><h3>{word(THEME_COUNT).replace(/^./, (c) => c.toUpperCase())} themes, all yours to tune</h3><p>Start from a theme preset, then change any colour, font, radius or spacing you like. The theme stays the source of truth, so you can always switch back.</p></article>
        <article className="card c-d"><h3>Publish and unpublish on your terms</h3><p>Every site gets a unique public address. Publish a snapshot when you are ready, keep editing as a draft, and take it down whenever you want.</p></article>
      </div></div></section>
      <section id="templates" className="paper-section">
        <div className="wrap">
          <h2>{word(TEMPLATE_COUNT).replace(/^./, (c) => c.toUpperCase())} templates, {word(CATEGORY_COUNT)} categories, one starting point.</h2>
          <p className="sub">
            Creator, developer, freelancer, business, launch, artist, musician, coach, restaurant, event.
            Every one is a real design, and every one is fully editable once you pick it.
          </p>
          <div className="dash">
            <div className="panel">
              <h4>What you get</h4>
              <div className="big">{TEMPLATE_COUNT} <span className="up">templates</span></div>
              <h4>across {CATEGORY_COUNT} categories</h4>
              <div className="bars">
                {CATEGORY_BARS.map(([name, count, width]) => (
                  <div className="bar" key={name}>
                    {name}
                    <div className="track"><div className="fill" style={{ width: `${width}%` }} /></div>
                    <span className="bar__count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="panel coach">
                <span className="hand">Also included</span>
                {word(THEME_COUNT).replace(/^./, (c) => c.toUpperCase())} theme presets, a mobile and desktop preview, undo and redo, autosave,
                image upload, and your own public address.
              </div>
              <div className="stats panel">
                <div><b>{SECTION_TYPES.length}</b>block types</div>
                <div><b>{THEMES.length}</b>theme presets</div>
                <div><b>3</b>device previews</div>
                <div><b>1</b>public link</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="how"><div className="wrap"><h2>Live in the time it takes to sharpen a pencil.</h2><div className="steps">{[['Pick a starting point', `Choose one of ${word(TEMPLATE_COUNT)} templates in the style that fits you.`], ['Tune the details', 'Edit the text, images, colours and links in the live editor.'], ['Publish and share', 'Get a unique public link and put it anywhere you like.']].map(([title, text]) => <div className="step" key={title}><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>
      <section id="pricing" className="paper-section">
        <div className="wrap">
          <h2>Everything included, free.</h2>
          <p className="sub">
            There is one plan, and it costs nothing. Everything the editor can do
            is available to every account, with no trial that expires and no card.
          </p>
          <div className="price price--single">
            <div className="plan hot">
              <h3>Linkora</h3>
              <div className="amt">₹0<small>/forever</small></div>
              <ul>
                {[
                  'Unlimited websites',
                  `All ${TEMPLATE_COUNT} templates`,
                  `All ${THEME_COUNT} themes`,
                  'Image upload',
                  'Drag-and-drop editing',
                  'Undo and redo',
                  'Autosave',
                  'A public link per site',
                  'Publish and unpublish any time',
                ].map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <a className="btn" href="/register">Create your page</a>
            </div>
          </div>
        </div>
      </section>
      <section id="claim" className="claim-section"><div className="wrap"><div className="final"><h2>Your link deserves better than a grey list.</h2><p>Choose your name now before someone else does.</p><a className="btn" href="/register">Create your page</a></div></div></section>
      <footer><div className="wrap footer-inner"><div><Logo /><p>Made for creators in India and everywhere else.</p></div><div><h5>Product</h5><ul><li><a href="#features">Features</a></li><li><a href="#templates">Templates</a></li><li><a href="#pricing">Pricing</a></li></ul></div><div><h5>Get started</h5><ul><li><a href="/register">Create a page</a></li><li><a href="/login">Log in</a></li><li><a href="/templates">Browse templates</a></li></ul></div></div></footer>
    </>
  )
}

const fields = [
  { key: 'firstName', label: 'What should we call you?', placeholder: 'Your first name', type: 'text' },
  { key: 'email', label: 'Where can we reach you?', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'What is your phone number?', placeholder: '+91 98765 43210', type: 'tel' },
  { key: 'instagram', label: 'What is your Instagram handle?', placeholder: '@codeandsecure_hub', type: 'text' },
  { key: 'followers', label: 'How many followers do you have?', placeholder: '10,000', type: 'number' },
  { key: 'password', label: 'Create a secure password', placeholder: 'At least 8 characters', type: 'password' },
]

function AuthShell({ children, eyebrow, title, description, login = false }) {
  return <main className="auth-page"><div className="auth-blob auth-blob-one" /><div className="auth-blob auth-blob-two" /><div className="auth-wrap"><div className="auth-top"><Logo /><a href={login ? '/register' : '/login'}>{login ? 'New here?' : 'Already a member?'} <strong>{login ? 'Create your page' : 'Log in'}</strong></a></div><div className="auth-card"><div className="auth-copy"><span className="hand">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div><p className="auth-footer">A beautiful link for everything you make.</p></div></main>
}

function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const field = fields[step]
  const value = form[field.key] || ''
  const submit = async (event) => {
    event.preventDefault()
    if (!String(value).trim() || submitting) return
    if (step < fields.length - 1) setStep(step + 1)
    else {
      setSubmitting(true)
      setError('')
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...form, followers: Number(form.followers) }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Registration failed.')
        window.location.href = '/home'
      } catch (requestError) {
        setError(requestError.message)
        setSubmitting(false)
      }
    }
  }
  return <AuthShell eyebrow="let's make something lovely" title="Your page starts with you." description="Tell us a little about yourself. One thoughtful step at a time."><form className="auth-form" onSubmit={submit}><div className="progress"><span style={{ width: `${((step + 1) / fields.length) * 100}%` }} /></div><div className="step-count">0{step + 1} <span>/ 0{fields.length}</span></div><label htmlFor={field.key}>{field.label}</label><input autoFocus id={field.key} name={field.key} type={field.type} inputMode={field.type === 'number' ? 'numeric' : undefined} placeholder={field.placeholder} value={value} onChange={(event) => { setError(''); setForm({ ...form, [field.key]: event.target.value }) }} required />{error && <p className="form-error" role="alert">{error}</p>}<button className="btn auth-submit" type="submit" disabled={submitting}>{submitting ? 'Creating...' : step === fields.length - 1 ? 'Create my page' : 'Continue'} <span>→</span></button>{step > 0 && <button className="back-button" type="button" onClick={() => setStep(step - 1)}>← Back</button>}</form></AuthShell>
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Login failed.')
      window.location.href = '/home'
    } catch (requestError) {
      setError(requestError.message)
      setSubmitting(false)
    }
  }
  return <AuthShell login eyebrow="welcome back" title="Your links missed you." description="Log in to keep creating, sharing and learning from your audience."><form className="auth-form" onSubmit={submit}><label htmlFor="login-email">Email address</label><input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(event) => { setError(''); setEmail(event.target.value) }} required /><label htmlFor="login-password">Password</label><input id="login-password" type="password" placeholder="Your password" value={password} onChange={(event) => { setError(''); setPassword(event.target.value) }} required />{error && <p className="form-error" role="alert">{error}</p>}<button className="btn auth-submit" type="submit" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'} <span>→</span></button><a className="back-button" href="/register">New here? Create your page</a></form></AuthShell>
}

function RequireAuth({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    apiRequest('/auth/me')
      .then(() => setStatus('authenticated'))
      .catch(() => {
        window.location.href = '/'
      })
  }, [])

  if (status !== 'authenticated') {
    return <main className="auth-page auth-loading"><p>Loading your Linkora home...</p></main>
  }

  return status === 'authenticated' ? children : <main className="auth-page auth-loading"><p>Loading your Linkora home...</p></main>
}

function App() {
  const path = window.location.pathname
  if (path === '/register') return <RegisterPage />
  if (path === '/login') return <LoginPage />
  if (path === '/home') return <RequireAuth><DashboardPage /></RequireAuth>
  if (path === '/templates') return <RequireAuth><TemplatesPage /></RequireAuth>
  if (path === '/builder/new') return <RequireAuth><NewBuilderRedirect /></RequireAuth>
  if (path.startsWith('/editor/')) return <RequireAuth><BuilderPage websiteId={path.split('/')[2]} /></RequireAuth>
  if (path.startsWith('/builder/')) return <RequireAuth><BuilderPage websiteId={path.split('/')[2]} /></RequireAuth>
  if (path.startsWith('/preview/')) return <RequireAuth><PreviewPage websiteId={path.split('/')[2]} /></RequireAuth>
  if (path.startsWith('/site/')) return <PublicWebsitePage slug={path.split('/')[2]} />
  if (path.startsWith('/p/')) return <PublicWebsitePage slug={path.split('/')[2]} />
  return <LandingPage />
}

function NewBuilderRedirect() {
  const [error, setError] = useState('')
  useEffect(() => {
    apiRequest('/websites', { method: 'POST', body: JSON.stringify({ name: 'Untitled website' }) })
      .then((result) => { window.location.href = `/editor/${result.website.id}` })
      .catch((requestError) => setError(requestError.message))
  }, [])
  return <main className="editor-loading">{error || 'Creating your blank page...'}</main>
}

export default App
