import $elements from '../dom/elements'

const invalidTargets = new Set(['_parent', '_top'])

/**
 * Guard against target beting set to something other than blank or self, while trying
 * to preserve the appearance of having the correct target value.
 */
export function handleInvalidEventTarget (e: Event & {target: HTMLFormElement | HTMLAnchorElement}) {
  let targetValue = e.target.target
  let targetSet = e.target.hasAttribute('target')

  if (invalidTargets.has(e.target.target)) {
    e.target.target = ''
  }

  const { getAttribute, setAttribute, removeAttribute } = e.target
  const targetDescriptor = Object.getOwnPropertyDescriptor(e.target, 'target')

  e.target.getAttribute = function (k) {
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

  e.target.setAttribute = function (k, v) {
    if (k === 'target') {
      targetSet = true
      targetValue = v

      return $elements.callNativeMethod(this, 'setAttribute', 'cyTarget', v)
    }

    return setAttribute.call(this, k, v)
  }

  e.target.removeAttribute = function (k) {
    if (k === 'target') {
      targetSet = false
      targetValue = ''

      // We're not using `$elements.callNativeMethod` here because it disallows `removeAttribute`.
      return removeAttribute.call(this, k)
    }
  }

  if (!targetDescriptor) {
    Object.defineProperty(e.target, 'target', {
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

/**
 * We need to listen to all click events on the window, but only handle anchor elements,
 * as those might be the ones where we have an incorrect "target" attr, or could have one
 * dynamically set in subsequent event bubbling.
 *
 * @param e
 */
export function handleInvalidAnchorTarget (e: Event & {target: HTMLAnchorElement}) {
  if (e.target.tagName === 'A') {
    handleInvalidEventTarget(e)
  }
}
