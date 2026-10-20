import { useMemo } from 'react'
import { describeSectionProps, LIST_ITEM_FIELDS, LIST_SECTION_TYPES } from '../../../shared/inspector.mjs'
import { SOCIAL_PLATFORMS } from '../../../shared/website-schema.mjs'
import { PLATFORM_LABELS } from '../components/platforms'
import { ArrowUpIcon, ArrowDownIcon, CloseIcon, PlusIcon } from '../components/icons'
import { ImageField } from './ImageField'

/**
 * The properties inspector.
 *
 * The controls are generated from the same specs the server validates
 * against, so the panel changes completely depending on what is selected and
 * never shows a control for a property that would be rejected on save.
 */

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((platform) => ({
  value: platform,
  label: PLATFORM_LABELS[platform] || platform,
}))

/* -------------------------------------------------------------------------- */
/* Individual controls                                                         */
/* -------------------------------------------------------------------------- */

function FieldShell({ label, help, children, htmlFor }) {
  return (
    <div className="insp-field">
      <label className="insp-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {help ? <p className="insp-help">{help}</p> : null}
    </div>
  )
}

function TextControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  if (control.control === 'textarea') {
    return (
      <FieldShell label={control.label} help={control.help} htmlFor={id}>
        <textarea id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows={3} />
      </FieldShell>
    )
  }
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <input id={id} type="text" value={value ?? ''} onChange={(event) => onChange(event.target.value)} />
    </FieldShell>
  )
}

function UrlControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  )
}

function NumberControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <div className="insp-number">
        <input
          id={id}
          type="range"
          min={control.min}
          max={control.max}
          step={control.step || 1}
          value={Number.isFinite(Number(value)) ? Number(value) : control.spec.default}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output htmlFor={id}>{value ?? control.spec.default}</output>
      </div>
    </FieldShell>
  )
}

function SelectControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  const options = control.options || control.spec.values || []
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <select id={id} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option
          const optionLabel = typeof option === 'object' ? option.label : String(option)
          return (
            <option key={String(optionValue)} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}

function ToggleControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  return (
    <div className="insp-field insp-field--toggle">
      <label className="insp-toggle" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="insp-toggle__track" aria-hidden="true">
          <span className="insp-toggle__thumb" />
        </span>
        <span className="insp-label">{control.label}</span>
      </label>
      {control.help ? <p className="insp-help">{control.help}</p> : null}
    </div>
  )
}

function ColorControl({ control, value, onChange }) {
  const id = `insp-${control.key}`
  // An empty colour means "inherit from the theme", which the renderer reads
  // as an absent value.
  const isInherited = !value
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#000000'
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <div className="insp-color">
        <input
          id={id}
          type="color"
          value={swatch}
          disabled={isInherited}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="insp-color__value">{isInherited ? 'Theme default' : value}</span>
        {isInherited ? null : (
          <button type="button" className="insp-link-button" onClick={() => onChange('')}>
            Reset
          </button>
        )}
      </div>
    </FieldShell>
  )
}

function RenderControl({ control, value, onChange, onUpload }) {
  const id = `insp-${control.key}`
  return (
    <FieldShell label={control.label} help={control.help} htmlFor={id}>
      <ImageField
        value={value || ''}
        onChange={onChange}
        onUpload={(file) => onUpload(control.key, file)}
        id={id}
      />
    </FieldShell>
  )
}

function Control({ control, value, onChange, onUpload }) {
  switch (control.control) {
    case 'textarea':
    case 'text':
      return <TextControl control={control} value={value} onChange={onChange} />
    case 'url':
      return <UrlControl control={control} value={value} onChange={onChange} />
    case 'number':
    case 'slider':
      return <NumberControl control={control} value={value} onChange={onChange} />
    case 'select':
      return <SelectControl control={control} value={value} onChange={onChange} />
    case 'toggle':
      return <ToggleControl control={control} value={value} onChange={onChange} />
    case 'color':
      return <ColorControl control={control} value={value} onChange={onChange} />
    case 'image':
      return <RenderControl control={control} value={value} onChange={onChange} onUpload={onUpload} />
    default:
      return null
  }
}

/* -------------------------------------------------------------------------- */
/* Repeating list editors                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The fields of a repeating item are read from the shared spec, so a list
 * editor and the server's validator can never disagree about what a social
 * link or a gallery image contains.
 */
function ListItemEditor({ item, index, fields, onChange, onRemove, onMove, onUpload }) {
  const title = item.platform
    ? PLATFORM_LABELS[item.platform] || 'Link'
    : `Image ${index + 1}`

  return (
    <li className="insp-list-item">
      <div className="insp-list-item__head">
        <span className="insp-list-item__title">{title}</span>
        <div className="insp-list-item__actions">
          <button type="button" onClick={() => onMove(index, -1)} aria-label="Move up" disabled={index === 0}>
            <ArrowUpIcon />
          </button>
          <button type="button" onClick={() => onMove(index, 1)} aria-label="Move down">
            <ArrowDownIcon />
          </button>
          <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${title.toLowerCase()}`}>
            <CloseIcon />
          </button>
        </div>
      </div>

      {fields.map((field) => {
        if (field.control === 'select') {
          return (
            <select
              key={field.key}
              aria-label={field.label}
              value={item[field.key] || ''}
              onChange={(event) => onChange(index, { [field.key]: event.target.value })}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        }

        if (field.control === 'image') {
          return (
            <ImageField
              key={field.key}
              value={item[field.key] || ''}
              onChange={(url) => onChange(index, { [field.key]: url })}
              onUpload={(file) => onUpload(index, file)}
              id={`list-image-${index}`}
            />
          )
        }

        return (
          <input
            key={field.key}
            aria-label={field.label}
            type={field.control === 'url' ? 'url' : 'text'}
            placeholder={field.control === 'url' ? 'https://' : field.label}
            value={item[field.key] || ''}
            onChange={(event) => onChange(index, { [field.key]: event.target.value })}
          />
        )
      })}
    </li>
  )
}

function ListEditor({ type, items, onChange, onUpload }) {
  const fields = LIST_ITEM_FIELDS[type] || []

  const updateItem = (index, patch) => {
    const next = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))

  const moveItem = (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const addItem = () => {
    // A new item starts with an empty value for every field the spec
    // declares, so a new social link or gallery image is valid at once.
    const blank = { id: `${type}-${Date.now()}` }
    for (const field of fields) {
      if (field.key === 'platform') blank.platform = 'instagram'
      else if (field.key === 'url') blank.url = ''
      else blank[field.key] = ''
    }
    onChange([...items, blank])
  }

  return (
    <div className="insp-list">
      <div className="insp-group__head">
        <h4>{type === 'social-links' ? 'Links' : 'Images'}</h4>
        <button type="button" className="insp-add-button" onClick={addItem}>
          <PlusIcon />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="insp-empty">Nothing here yet.</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <ListItemEditor
              key={item.id || index}
              item={item}
              index={index}
              fields={fields}
              onChange={updateItem}
              onRemove={removeItem}
              onMove={moveItem}
              onUpload={onUpload}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function InspectorPanel({
  selected,
  onChangeProp,
  onChangeItems,
  onUpload,
  onUploadGalleryItem,
  title,
}) {
  const groups = useMemo(() => (selected ? describeSectionProps(selected.type) : []), [selected])

  if (!selected) {
    return (
      <aside className="inspector" aria-label="Properties">
        <div className="inspector__empty">
          <span className="inspector__empty-mark" aria-hidden="true" />
          <h3>Nothing selected</h3>
          <p>Select a block on the canvas to edit it, or choose one from the Layers list.</p>
        </div>
      </aside>
    )
  }

  const props = selected.props || {}
  const isList = LIST_SECTION_TYPES.has(selected.type)

  return (
    <aside className="inspector" aria-label={`${title} properties`}>
      <header className="inspector__head">
        <div>
          <span className="inspector__eyebrow">{title}</span>
          <h3>{title}</h3>
        </div>
      </header>

      {isList ? (
        <ListEditor
          type={selected.type}
          items={props.items || []}
          onChange={(items) => onChangeItems(items)}
          onUpload={onUploadGalleryItem}
        />
      ) : null}

      {groups.map((group) => (
        <section className="insp-group" key={group.label}>
          <h4 className="insp-group__title">{group.label}</h4>
          {group.controls.map((control) => (
            <Control
              key={control.key}
              control={control}
              value={props[control.key]}
              onChange={(value) => onChangeProp(control.key, value)}
              onUpload={onUpload}
            />
          ))}
        </section>
      ))}
    </aside>
  )
}
