/**
 * Functions injected into the AUT frame over CDP `Runtime.callFunctionOn`,
 * serialized with `fn.toString()`. They read the app-under-test's live DOM, so
 * they run in the browser, not in this Node process — two constraints follow
 * and MUST hold, or the injected copy diverges from this (tested) source:
 *
 *   1. Fully self-contained. A function may reference only its own parameters
 *      and browser globals (`document`, `getComputedStyle`, `Math`); never an
 *      import or module-scope binding, which does not exist in the AUT frame.
 *      (This is why `readElementInfo` takes the style list as an argument
 *      rather than closing over a constant.)
 *   2. ES2015 syntax only. The shipped bundle targets es2016 (tsconfig.build),
 *      where object spread / async / optional chaining lower to `tslib` helpers
 *      that reference module scope — those would be `undefined` once injected.
 *      `const`/`let`, template literals, `for…of`, and `Array.from` all emit
 *      verbatim at es2016, so keep to those.
 *
 * Because they touch only a few DOM globals, the unit tests stub those globals
 * and call the real functions directly.
 */

export interface DomReadResult {
  html?: string
  matches?: { count: number, html: string[] }
  truncated?: boolean
  invalidSelector?: boolean
}

// Caps output while walking, so a heavy page never serializes megabytes across
// CDP. Returns a tagged object rather than throwing, so a bad selector
// round-trips as data instead of a CDP exception.
export function readDom (selector: string | null, maxChars: number): DomReadResult {
  if (selector === null) {
    const html = document.documentElement ? document.documentElement.outerHTML : ''

    return html.length > maxChars ? { html: html.slice(0, maxChars), truncated: true } : { html }
  }

  let els: Element[]

  try {
    els = Array.from(document.querySelectorAll(selector))
  } catch (_e) {
    return { invalidSelector: true }
  }

  const out: string[] = []
  let remaining = maxChars
  let truncated = false

  for (const el of els) {
    const html = el.outerHTML

    if (html.length > remaining) {
      if (remaining > 0) {
        out.push(html.slice(0, remaining))
      }

      truncated = true
      break
    }

    out.push(html)
    remaining -= html.length
  }

  return { matches: { count: els.length, html: out }, truncated }
}

export interface ElementInfo {
  tag: string
  attributes: Record<string, string>
  styles: Record<string, string>
  box: { x: number, y: number, width: number, height: number }
}

// Reads the element's tag, attributes, curated computed styles, and box rect in
// one call on the element itself (bound as `this` via the CDP objectId) —
// avoiding the DOM/CSS node-id dance (`requestNode` needs a fetched document
// tree and is brittle across worlds). `reportedStyles` is the curated property
// list, passed in to keep this function self-contained (see file header).
export function readElementInfo (this: Element, reportedStyles: string[]): ElementInfo {
  const computed = getComputedStyle(this)
  const styles: Record<string, string> = {}

  // Report every curated property verbatim rather than filtering: the list is
  // already hand-picked, and a truthiness guard would drop meaningful values
  // (a resolved `0`, an empty `content`) and make the output non-deterministic.
  for (const prop of reportedStyles) {
    styles[prop] = computed.getPropertyValue(prop)
  }

  const attributes: Record<string, string> = {}

  for (const attr of Array.from(this.attributes)) {
    attributes[attr.name] = attr.value
  }

  const rect = this.getBoundingClientRect()

  return {
    tag: this.tagName.toLowerCase(),
    attributes,
    styles,
    box: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
  }
}
