import { useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { resolveDocument } from '../../../shared/resolve.mjs'
import { fontStack } from '../../../shared/themes.mjs'
import { SectionView } from '../components/sections'
import { GripIcon, CopyIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../components/icons'

/**
 * The live canvas.
 *
 * The canvas renders the same document the published page will render, using
 * the same `SectionView` components, so what the user sees while editing is
 * what the visitor gets.
 *
 * Sections are draggable with dnd-kit. The keyboard sensor provides an
 * accessible alternative: a focused section can be moved with the space bar
 * and the arrow keys.
 */

function SortableSection({ section, selected, onSelect, onDuplicate, onRemove, onMove, index, total, tokens }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-block ${selected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''}`}
      data-section-id={section.id}
    >
      {/*
        The chrome is always in the DOM so the drag handle is reachable
        without selecting the block first. It is visually revealed on hover
        and stays visible while the block is selected.
      */}
      <div className="canvas-block__chrome" data-visible={selected ? 'true' : undefined}>
        <button
          type="button"
          className="canvas-handle"
          aria-label={`Reorder this ${section.type} block`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon size={16} />
        </button>
        <span className="canvas-block__type">{section.type}</span>
        <div className="canvas-block__tools">
          <button type="button" onClick={() => onMove(section.id, -1)} aria-label="Move block up" disabled={index === 0}>
            <ArrowUpIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => onMove(section.id, 1)}
            aria-label="Move block down"
            disabled={index === total - 1}
          >
            <ArrowDownIcon size={15} />
          </button>
          <button type="button" onClick={() => onDuplicate(section.id)} aria-label="Duplicate block">
            <CopyIcon size={15} />
          </button>
          <button type="button" onClick={() => onRemove(section.id)} aria-label="Delete block">
            <TrashIcon size={15} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="canvas-block__select"
        onClick={() => onSelect(section.id)}
        aria-label={`Select ${section.type} block`}
        aria-pressed={selected}
      >
        <SectionView section={section} tokens={tokens} />
      </button>
    </div>
  )
}

export default function EditorCanvas({
  website,
  selectedId,
  onSelect,
  onReorder,
  onDuplicate,
  onRemove,
  onMove,
  device,
  zoom,
}) {
  const resolved = useMemo(
    () => resolveDocument({ site: website.site, profile: website.profile, sections: website.sections }),
    [website.site, website.profile, website.sections],
  )

  const { tokens, sections } = resolved
  const { colors, typography } = tokens
  const visible = sections.filter((section) => !section.props?.hidden)

  const sensors = useSensors(
    // A small activation distance keeps a click on a link from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    // The reorder is expressed in terms of the two section *ids*, so the
    // caller can find them in the full section array. Hidden sections are
    // still in that array and must keep their place.
    onReorder(active.id, over.id)
  }

  const canvasStyle = {
    '--lx-radius': `${tokens.radius}px`,
    '--lx-shadow': tokens.shadow,
    '--lx-accent': colors.accent,
    '--lx-accent-text': colors.accentText,
    '--lx-surface': colors.surface,
    '--lx-border': colors.border,
    '--lx-muted': colors.muted,
    '--lx-heading-font': fontStack(typography.headingFont),
    '--lx-scale': typography.scale,
  }

  return (
    <div className="canvas-stage">
      <div
        className={`device-frame device-frame--${device}`}
        style={{ '--canvas-zoom': zoom }}
      >
        <div
          className={`website-canvas lx-layout--${tokens.layout}`}
          style={{
            ...canvasStyle,
            color: colors.text,
            fontFamily: fontStack(typography.bodyFont),
            background: tokens.background?.type === 'gradient'
              ? `linear-gradient(160deg, ${tokens.background.value || colors.background} 0%, ${tokens.background.secondary || colors.surface} 100%)`
              : tokens.background?.type === 'image' && tokens.background.value
                ? `${tokens.background.value} center / cover`
                : tokens.background?.value || colors.background,
            maxWidth: `${tokens.contentWidth}px`,
            gap: `${Math.round(24 * tokens.spacingScale)}px`,
            padding: `${Math.round(40 * tokens.spacingScale)}px ${Math.round(24 * tokens.spacingScale)}px`,
          }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visible.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              {visible.length === 0 ? (
                <div className="empty-canvas-message">
                  <span className="lx-eyebrow">your canvas is ready</span>
                  <strong>Add your first block</strong>
                  <small>Choose one from the Add panel on the left.</small>
                </div>
              ) : (
                visible.map((section, index) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    index={index}
                    total={visible.length}
                    selected={selectedId === section.id}
                    onSelect={onSelect}
                    onDuplicate={onDuplicate}
                    onRemove={onRemove}
                    onMove={onMove}
                    tokens={tokens}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
