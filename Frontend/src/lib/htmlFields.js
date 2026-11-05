// These two functions are also injected into the sandboxed iframe as source
// text, so they must stay self-contained (no imports, no outside references).

export function extractFields(root) {
  var texts = []
  var links = []
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, HEAD: 1 }
  var SVG_OK = { svg: 1, g: 1, text: 1, tspan: 1, a: 1 }

  function walk(node, inSvg) {
    for (var c = node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) {
        if (c.nodeValue.trim() && /[A-Za-z0-9@]/.test(c.nodeValue)) texts.push(c)
      } else if (c.nodeType === 1) {
        if (SKIP[c.nodeName.toUpperCase()]) continue
        var tag = c.nodeName.toLowerCase()
        var svg = inSvg || tag === 'svg'
        if (svg && !SVG_OK[tag]) continue
        if (tag === 'a' && c.hasAttribute('href')) links.push(c)
        walk(c, svg)
      }
    }
  }
  walk(root, false)
  return { texts: texts, links: links }
}

export function normalizeHref(value) {
  var v = String(value || '').trim()
  if (!v) return ''
  if (/^(https?:|mailto:|tel:|#)/i.test(v)) return v
  if (/^[^\s@\/:]+@[^\s@\/:]+\.[^\s@\/:]+$/.test(v)) return 'mailto:' + v
  if (/^\+?[\d\s().-]{6,}$/.test(v)) return 'tel:' + v.replace(/[^\d+]/g, '')
  return 'https://' + v
}