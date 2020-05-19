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
  const { dom, state } = this

  const getTargetValue = () => {
    const targetValue = accessedObject[accessedProp]
    const accessingDocument = dom.isDocument(accessedObject)
    const hasLocation = dom.isWindow(accessedObject) || accessingDocument

    if (hasLocation && accessedProp === 'location') {
      if (accessingDocument) {
        // `document.location` is the same reference as `window.location`.
        // use `window.location` so that the location Proxy can be cached in the same
        // place on `window` regardless of if it is accessed via `document` or `window`
        accessedObject = currentWindow
      }

      const targetLocation = resolveLocationReference(accessedObject)

      if (isValPassed) {
        return targetLocation.href = value
      }

      return targetLocation
    }

    if (_.isFunction(targetValue)) {
      return targetValue.bind(accessedObject)
    }

    return targetValue
  }

  const setTargetValue = () => {
    if (dom.isWindow(accessedObject) && accessedProp === 'location') {
      const targetLocation = resolveLocationReference(accessedObject)

      return targetLocation.href = value
    }

    return (accessedObject[accessedProp] = value)
  }

  const isValPassed = arguments.length === 4

  const $autIframe = state('$autIframe')

  if (!$autIframe) {
    // missing AUT iframe, resolve the property access normally
    if (isValPassed) {
      return setTargetValue()
    }

    return getTargetValue()
  }

  const contentWindow = $autIframe.prop('contentWindow')

  if (accessedObject === currentWindow.top) {
    // doing a property access on topmost window, adjust accessedObject
    accessedObject = contentWindow
  }

  const targetValue = getTargetValue()

  if (!dom.isWindow(targetValue) || dom.isJquery(targetValue)) {
    if (isValPassed) {
      return setTargetValue()
    }

    return targetValue
  }

  // targetValue is a reference to a Window object

  if (accessedProp === 'top') {
    // note: `isValPassed` is not considered here because `window.top` is readonly
    return contentWindow
  }

  if (accessedProp === 'parent') {
    // note: `isValPassed` is not considered here because `window.parent` is readonly
    if (targetValue === currentWindow.top) {
      return contentWindow
    }

    return targetValue
  }

  throw new Error('unhandled resolveWindowReference')
}

/**
 * Fix `window.location` usages that would otherwise navigate to the wrong URL.
 *
 * @param currentWindow the value of `globalThis` from the scope of the location reference in question
 */
export function resolveLocationReference (currentWindow: Window) {
  // @ts-ignore
  if (currentWindow.__cypressFakeLocation) {
    // @ts-ignore
    return currentWindow.__cypressFakeLocation
  }

  function _resolveHref (href: string) {
    const a = currentWindow.document.createElement('a')

    a.href = href

    // a.href will be resolved into the correct fully-qualified URL
    return a.href
  }

  function assign (href: string) {
    return currentWindow.location.assign(_resolveHref(href))
  }

  function replace (href: string) {
    return currentWindow.location.replace(_resolveHref(href))
  }

  function setHref (href: string) {
    return currentWindow.location.href = _resolveHref(href)
  }

  const locationKeys = Object.keys(currentWindow.location)

  const fakeLocation = {}

  _.reduce(locationKeys, (acc, cur) => {
    // set a dummy value, the proxy will handle sets/gets
    acc[cur] = Symbol.for('Proxied')

    return acc
  }, {})

  // @ts-ignore
  return currentWindow.__cypressFakeLocation = new Proxy(fakeLocation, {
    get (_target, prop, _receiver) {
      if (prop === 'assign') {
        return assign
      }

      if (prop === 'replace') {
        return replace
      }

      return currentWindow.location[prop]
    },
    set (_obj, prop, value) {
      if (prop === 'href') {
        return setHref(value)
      }

      return currentWindow.location[prop] = value
    },
  })
}
