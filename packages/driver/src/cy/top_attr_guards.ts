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
  neutralizeUnsafeBaseTarget(e.target?.ownerDocument)
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
  // `<base target>` neutralization is document-scoped, so it must run regardless
  // of which descendant the click landed on (e.g. `<a><img></a>` gives an <img>
  // target — the anchor-attribute patch below is skipped, but the base fallback
  // would still navigate out of the AUT frame without this call).
  neutralizeUnsafeBaseTarget(e.target?.ownerDocument)

  if (e.target.tagName === 'A') {
    handleInvalidTarget(e.target)
  }
}

/**
 * Guard against target being set to something other than blank or self, while trying
 * to preserve the appearance of having the correct target value.
 */
export function handleInvalidTarget (el: HTMLFormElement | HTMLAnchorElement) {
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
