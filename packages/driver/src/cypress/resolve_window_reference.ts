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
  const actualValue = accessedObject[accessedProp]

  const isValPassed = arguments.length === 4

  const $autIframe = state('$autIframe')

  if (!$autIframe) {
    // TODO: warning?
    if (isValPassed) {
      return (accessedObject[accessedProp] = value)
    }

    return actualValue
  }

  const contentWindow = $autIframe.prop('contentWindow')

  if (accessedObject === currentWindow.top && ['frames', 'location'].includes(accessedProp)) {
    // doing a property access to `top`
    if (isValPassed) {
      return (contentWindow[accessedProp] = value)
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

  // actualValue is a reference to a Window
  if (accessedProp === 'top') {
    if (isValPassed) {
      // TODO: will Cypress blow up?
      // TODO: this should really be changing value (RHS), not the LHS, maybe
      $autIframe.prop('contentWindow', value)

      return value
    }

    return contentWindow
  }

  if (accessedProp === 'parent') {
    if (actualValue === currentWindow.top) {
      if (isValPassed) {
        // TODO: will Cypress blow up?
        $autIframe.prop('contentWindow', value)

        return value
      }

      return contentWindow
    }

    // else, return the actual parent
    if (isValPassed) {
      return (accessedObject[accessedProp] = value)
    }

    return actualValue
  }
}
