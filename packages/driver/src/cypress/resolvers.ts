import _ from 'lodash'
import $Cypress from '../..'

/**
 * Fix property reads and writes that could potentially help the AUT to break out of its iframe.
 *
 * @param currentWindow the value of `globalThis` from the scope of the window reference in question
 * @param accessedObject a reference to the object being accessed
 * @param accessedProp the property name being accessed (Symbol/number properties are not intercepted)
 * @param value the right-hand side of an assignment operation (accessedObject.accessedProp = value)
 */
export function resolveWindowReference (this: typeof $Cypress, currentWindow: Window, accessedObject: Window | any, accessedProp: string, value?: any) {
  const Cypress = this
  const { dom } = Cypress
  const state = Cypress.state
  const actualValue = accessedObject[accessedProp]

  const isValPassed = arguments.length === 4

  const $autIframe = state('$autIframe')

  if (!$autIframe) {
    // missing AUT iframe, resolve the property access normally
    if (isValPassed) {
      return (accessedObject[accessedProp] = value)
    }

    return actualValue
  }

  const contentWindow = $autIframe.prop('contentWindow')

  if (accessedObject === currentWindow.top && ['frames', 'location'].includes(accessedProp)) {
    // doing a property access on topmost window
    if (isValPassed) {
      return (contentWindow[accessedProp] = value)
    }

    if (accessedProp === 'location') {
      return resolveLocationReference(contentWindow)
    }

    return contentWindow[accessedProp]
  }

  if (!isValPassed && _.isFunction(actualValue)) {
    return actualValue.bind(accessedObject)
  }

  if (!dom.isWindow(actualValue) || dom.isJquery(actualValue)) {
    if (isValPassed) {
      return (accessedObject[accessedProp] = value)
    }

    return actualValue
  }

  // actualValue is a reference to a Window object
  if (accessedProp === 'top') {
    // note: `isValPassed` is not considered here because `window.top` is readonly
    return contentWindow
  }

  if (accessedProp === 'parent') {
    // note: `isValPassed` is not considered here because `window.parent` is readonly
    if (actualValue === currentWindow.top) {
      return contentWindow
    }

    return actualValue
  }

  throw new Error('unhandled')
}

/**
 * Fix a bug that can cause `window.location.href = 'relative-url'` to resolve to the wrong URL.
 */
export function resolveLocationReference (currentWindow: Window) {
  if (currentWindow.__cypressFakeLocation) {
    return currentWindow.__cypressFakeLocation
  }

  function _resolveHref (href: string) {
    const a = currentWindow.document.createElement('a')

    a.href = href

    // a.href will be resolved into the fully-qualified URL
    return a.href
  }

  function assign (href: string) {
    return currentWindow.location.href = _resolveHref(href)
  }

  function replace (href: string) {
    return currentWindow.location.replace(_resolveHref(href))
  }

  const locationKeys = Object.keys(currentWindow.location)

  const fakeLocation = _.reduce(locationKeys, (acc, cur) => {
    // set a dummy value, the proxy will handle sets/gets
    acc[cur] = null

    return acc
  }, {})

  return currentWindow.__cypressFakeLocation = new Proxy(fakeLocation, {
    get (target, prop, _receiver) {
      if (prop === 'assign') {
        return assign
      }

      if (prop === 'replace') {
        return replace
      }

      return currentWindow.location[prop]
    },
    set (obj, prop, value) {
      if (prop === 'href') {
        return assign(value)
      }

      return currentWindow.location[prop] = value
    },
  })
}
