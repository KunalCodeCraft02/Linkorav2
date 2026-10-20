import { useMemo, useState } from 'react'
import { SECTION_DEFS, SECTION_GROUPS } from '../../../shared/website-schema.mjs'
import { TEMPLATES } from '../../../shared/templates.mjs'
import { THEMES } from '../../../shared/themes.mjs'
import {
  UserIcon,
  TypeIcon,
  ImageIcon,
  LinkIcon,
  ShareIcon,
  CardIcon,
  GridIcon,
  PlayIcon,
  MailIcon,
  MinusIcon,
  SpaceIcon,
  GripIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  TrashIcon,
  LayoutIcon,
  PaletteIcon,
  LayersIcon,
  SettingsIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../components/icons'

/**
 * The left sidebar: everything that can be *added* to the page, plus the
 * layer list that shows what is already there.
 *
 * The panel is deliberately split into views rather than one long scroll:
 * a builder where the add-panel and the layer list compete for the same
 * space ends up with neither of them usable.
 */

const ICONS = {
  user: UserIcon,
  type: TypeIcon,
  image: ImageIcon,
  link: LinkIcon,
  share: ShareIcon,
  card: CardIcon,
  grid: GridIcon,
  play: PlayIcon,
  mail: MailIcon,
  minus: MinusIcon,
  space: SpaceIcon,
}

const VIEWS = [
  { id: 'add', label: 'Add', Icon: PlusGridIcon },
  { id: 'templates', label: 'Templates', Icon: LayoutIcon },
  { id: 'themes', label: 'Themes', Icon: PaletteIcon },
  { id: 'layers', label: 'Layers', Icon: LayersIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
]

/** A compact plus-grid mark used for the "Add" tab. */
function PlusGridIcon(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth || 1.7} strokeLinecap="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <path d="M17 14v6M14 17h6" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */

function AddView({ onAdd, search, setSearch }) {
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    return SECTION_GROUPS.map((group) => ({
      ...group,
      items: Object.entries(SECTION_DEFS)
        .filter(([, def]) => def.group === group.id)
        .filter(([, def]) => !term || def.label.toLowerCase().includes(term) || def.description.toLowerCase().includes(term)),
    })).filter((group) => group.items.length)
  }, [search])

  return (
    <div className="sidebar-view">
      <label className="sidebar-search">
        <SearchIcon size={16} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search blocks"
          aria-label="Search blocks"
        />
      </label>

      {groups.length === 0 ? (
        <p className="insp-empty">No blocks match that search.</p>
      ) : (
        groups.map((group) => (
          <section className="sidebar-group" key={group.id}>
            <h4 className="sidebar-group__title">{group.label}</h4>
            <div className="block-grid">
              {group.items.map(([type, def]) => {
                const Icon = ICONS[def.icon] || TypeIcon
                return (
                  <button type="button" className="block-button" key={type} onClick={() => onAdd(type)} title={def.description}>
                    <span className="block-button__icon">
                      <Icon size={18} />
                    </span>
                    <span className="block-button__label">{def.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function TemplatesView({ currentTemplateId, onApply }) {
  const [category, setCategory] = useState('All')

  const categories = useMemo(
    () => ['All', ...new Set(TEMPLATES.map((template) => template.category))],
    [],
  )

  const visible = useMemo(
    () => (category === 'All' ? TEMPLATES : TEMPLATES.filter((template) => template.category === category)),
    [category],
  )

  return (
    <div className="sidebar-view">
      <p className="sidebar-note">
        Switching template keeps your content where it can. You can undo it if you change your mind.
      </p>

      <div className="chip-row" role="group" aria-label="Filter by category">
        {categories.map((entry) => (
          <button
            type="button"
            key={entry}
            className={`chip ${category === entry ? 'is-active' : ''}`}
            aria-pressed={category === entry}
            onClick={() => setCategory(entry)}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="template-list">
        {visible.map((template) => (
          <button
            type="button"
            key={template.id}
            className={`template-card ${template.id === currentTemplateId ? 'is-current' : ''}`}
            onClick={() => onApply(template.id)}
          >
            <span className="template-card__swatches" aria-hidden="true">
              {template.swatches.map((colour) => (
                <i key={colour} style={{ background: colour }} />
              ))}
            </span>
            <span className="template-card__body">
              <strong>{template.name}</strong>
              <small>{template.description}</small>
            </span>
            {template.id === currentTemplateId ? <span className="template-card__badge">In use</span> : null}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThemesView({ currentThemeId, onApply }) {
  return (
    <div className="sidebar-view">
      <p className="sidebar-note">
        A theme sets the colours, fonts and buttons together. You can still change any single value afterwards.
      </p>
      <div className="theme-list">
        {THEMES.map((theme) => (
          <button
            type="button"
            key={theme.id}
            className={`theme-card ${theme.id === currentThemeId ? 'is-current' : ''}`}
            onClick={() => onApply(theme.id)}
            aria-pressed={theme.id === currentThemeId}
          >
            <span className="theme-card__swatches" aria-hidden="true">
              <i style={{ background: theme.colors.background }} />
              <i style={{ background: theme.colors.accent }} />
              <i style={{ background: theme.colors.text }} />
              <i style={{ background: theme.colors.highlight }} />
            </span>
            <span className="theme-card__body">
              <strong>{theme.name}</strong>
              <small>{theme.description}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LayersView({ sections, selectedId, onSelect, onToggleHidden, onMove, onRemove, onDuplicate }) {
  if (!sections.length) {
    return (
      <div className="sidebar-view">
        <p className="insp-empty">
          This page has no blocks yet. Add one from the <strong>Add</strong> tab.
        </p>
      </div>
    )
  }

  return (
    <div className="sidebar-view">
      <p className="sidebar-note">Drag the handle on the canvas to reorder, or use the arrow buttons.</p>
      <ul className="layer-list">
        {sections.map((section, index) => {
          const def = SECTION_DEFS[section.type]
          const Icon = ICONS[def?.icon] || TypeIcon
          return (
            <li key={section.id}>
              <div className={`layer-item ${section.id === selectedId ? 'is-selected' : ''}`}>
                <button
                  type="button"
                  className="layer-item__grip"
                  aria-label={`Reorder ${def?.label || section.type}`}
                  title="Drag to reorder"
                >
                  <GripIcon size={16} />
                </button>
                <button type="button" className="layer-item__name" onClick={() => onSelect(section.id)}>
                  <Icon size={16} />
                  <span>{def?.label || section.type}</span>
                </button>
                <div className="layer-item__actions">
                  <button
                    type="button"
                    onClick={() => onMove(section.id, -1)}
                    aria-label={`Move ${def?.label || section.type} up`}
                    disabled={index === 0}
                  >
                    <ArrowUpIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(section.id, 1)}
                    aria-label={`Move ${def?.label || section.type} down`}
                    disabled={index === sections.length - 1}
                  >
                    <ArrowDownIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleHidden(section.id)}
                    aria-label={section.props?.hidden ? `Show ${def?.label || section.type}` : `Hide ${def?.label || section.type}`}
                  >
                    {section.props?.hidden ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  </button>
                  <button type="button" onClick={() => onDuplicate(section.id)} aria-label={`Duplicate ${def?.label || section.type}`}>
                    <CopyIcon size={15} />
                  </button>
                  <button type="button" onClick={() => onRemove(section.id)} aria-label={`Delete ${def?.label || section.type}`}>
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function LeftSidebar({
  view,
  setView,
  search,
  setSearch,
  sections,
  selectedId,
  onSelect,
  onAdd,
  onToggleHidden,
  onMove,
  onRemove,
  onDuplicate,
  currentTemplateId,
  onApplyTemplate,
  currentThemeId,
  onApplyTheme,
  children,
}) {
  return (
    <aside className="sidebar" aria-label="Editor tools">
      <nav className="sidebar-tabs" aria-label="Editor panels">
        {VIEWS.map(({ id, label, Icon }) => (
          <button
            type="button"
            key={id}
            className={view === id ? 'is-active' : ''}
            aria-current={view === id ? 'page' : undefined}
            onClick={() => setView(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__body">
        {view === 'add' && <AddView onAdd={onAdd} search={search} setSearch={setSearch} />}
        {view === 'templates' && (
          <TemplatesView currentTemplateId={currentTemplateId} onApply={onApplyTemplate} />
        )}
        {view === 'themes' && <ThemesView currentThemeId={currentThemeId} onApply={onApplyTheme} />}
        {view === 'layers' && (
          <LayersView
            sections={sections}
            selectedId={selectedId}
            onSelect={onSelect}
            onToggleHidden={onToggleHidden}
            onMove={onMove}
            onRemove={onRemove}
            onDuplicate={onDuplicate}
          />
        )}
        {view === 'settings' && children}
      </div>
    </aside>
  )
}

