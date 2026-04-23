import $elements from '../dom/elements'

const invalidTargets = new Set(['_parent', '_top'])

export type GuardedEvent = Event & {target: HTMLFormElement | HTMLAnchorElement}

/**
 * A `<base target>` is inherited by every untargeted <a> / <form>, so a value of
 * `_top` or `_parent` will navigate the AUT out of the Cypress iframe even if
 * the individual element's `target` attribute is empty. The proxy's HTML rewriter
 * handles this at load time; this guard backstops dynamically inserted or
 * post-load-modified <base> tags that bypass the rewriter.
 */
function neutralizeUnsafeBaseTarget (doc: Document | null | undefined) {
  if (!doc) return

  const base = doc.querySelector('base[target]') as HTMLBaseElement | null

  // `HTMLBaseElement.target` reflects the raw content attribute without case
  // normalization, but the browser matches `_top` / `_parent` case-insensitively
  // at navigation time — so `<base target="_TOP">` would escape the AUT iframe
  // unless we lowercase the comparison.
  if (base && invalidTargets.has(base.target.toLowerCase())) {
    base.removeAttribute('target')
  }
}

/**
 * Guard against target being set to something other than blank or self, while trying
 * to preserve the appearance of having the correct target value.
 */
export function handleInvalidEventTarget (e: GuardedEvent) {
  handleInvalidTarget(e.target)
}

export type GuardedAnchorEvent = Event & {target: HTMLAnchorElement}

/**
 * We need to listen to all click events on the window, but only handle anchor elements,
 * as those might be the ones where we have an incorrect "target" attr, or could have one
 * dynamically set in subsequent event bubbling.
 *
 * @param e
 */
export function handleInvalidAnchorTarget (e: GuardedAnchorEvent) {
  if (e.target.tagName === 'A') {
    handleInvalidTarget(e.target)

    return
  }

  // A click on a descendant of an anchor (e.g. `<a><span>`) sets `e.target` to the
  // descendant rather than the anchor. The navigation still bubbles up to the <a>
  // and inherits the document's base target, so base-level neutralization must run
  // independently of the per-element anchor patch.
  neutralizeUnsafeBaseTarget(e.target?.ownerDocument)
}

/**
 * Guard against target being set to something other than blank or self, while trying
 * to preserve the appearance of having the correct target value.
 */
export function handleInvalidTarget (el: HTMLFormElement | HTMLAnchorElement) {
  // Neutralize unsafe `<base target>` before any per-element patching. Every
  // navigation path — same-origin submit events, cross-origin programmatic
  // `form.submit()`, anchor clicks — routes through here, so the document-scoped
  // neutralization lives here to keep all call sites covered.
  neutralizeUnsafeBaseTarget(el.ownerDocument)

  let targetValue = el.target
  let targetSet = el.hasAttribute('target')

  if (invalidTargets.has(el.target)) {
    el.target = ''
  }

  const { getAttribute, setAttribute, removeAttribute } = el
  const targetDescriptor = Object.getOwnPropertyDescriptor(el, 'target')

  el.getAttribute = function (k) {
    if (k === 'target') {
      // https://github.com/cypress-io/cypress/issues/17512
      // When the target attribute doesn't exist, it should return null.
      // @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute#non-existing_attributes
      if (!targetSet) {
        return null
      }

      return targetValue
    }

    return getAttribute.call(this, k)
  }

  el.setAttribute = function (k, v) {
    if (k === 'target') {
      targetSet = true
      targetValue = v

      return $elements.callNativeMethod(this, 'setAttribute', 'cyTarget', v)
    }

    return setAttribute.call(this, k, v)
  }

  el.removeAttribute = function (k) {
    if (k === 'target') {
      targetSet = false
      targetValue = ''
    }

    // We're not using `$elements.callNativeMethod` here because it disallows `removeAttribute`.
    return removeAttribute.call(this, k)
  }

  if (!targetDescriptor) {
    Object.defineProperty(el, 'target', {
      configurable: false,
      set (value) {
        return targetValue = value
      },
      get () {
        return targetValue
      },
    })
  }
}
