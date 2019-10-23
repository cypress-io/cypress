import _ from 'lodash'
import $Cypress from '../..'

// TODO: fix this so that it's an override for entire `driver` package
interface State {
  (k: '$autIframe', v?: JQuery<HTMLIFrameElement>): Optional<JQuery<HTMLIFrameElement>>
}

export function resolveWindowReference (this: typeof $Cypress, currentWindow: Window, accessedObject: Window | any, accessedProp: string, value?: any) {
  const Cypress = this // TODO: don't do this terrible thing
  const { dom } = Cypress
  const state = Cypress.state as State

  const isValSet = arguments.length === 4

  function getOrSet (obj: any = accessedObject, prop: string): typeof obj {
    if (isValSet) { // setting
      return (obj[prop] = value)
    }

    // getting
    if (_.isFunction(actualValue)) {
      return actualValue.bind(accessedObject)
    }

    return actualValue
  }

  const actualValue = accessedObject[accessedProp]

  const $autIframe = state('$autIframe')

  if (!$autIframe) {
    // TODO: warning?
    return getOrSet()
  }

  const contentWindow = $autIframe.prop('contentWindow')

  if (accessedObject === currentWindow.top && ['frames', 'location'].includes(accessedProp)) {
    // doing a property access to `top`
    return getOrSet(contentWindow)
  }

  if (!dom.isWindow(actualValue) || dom.isJquery(actualValue)) {
    return getOrSet()
  }

  // actualValue is a reference to a Window
  if (accessedProp === 'top') {
    return getOrSet(contentWindow)
  }

  if (accessedProp === 'parent') {
    if (actualValue === currentWindow.top) {
      return getOrSet(contentWindow)

      return contentWindow
    }

    // else, return the actual parent
    return getOrSet()
  }
}
