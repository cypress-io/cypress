import _ from 'lodash'
import $Cypress from '../..'

// TODO: fix this so that it's an override for entire `driver` package
interface State {
  (k: '$autIframe', v?: JQuery<HTMLIFrameElement>): Optional<JQuery<HTMLIFrameElement>>
}

export function resolveWindowReference (this: typeof $Cypress, currentWindow: Window, maybeWindow: Window | any, prop: string) {
  const Cypress = this // TODO: don't do this terrible thing
  const { dom } = Cypress
  const state = Cypress.state as State

  const val = maybeWindow[prop]

  if (_.isFunction(val)) {
    return val.bind(maybeWindow)
  }

  if (!dom.isWindow(val) || dom.isJquery(val)) {
    return val
  }

  const $autIframe = state('$autIframe')

  if (!$autIframe) {
    // TODO: warning?
    return val
  }

  const contentWindow = $autIframe.prop('contentWindow')

  // val is a reference to a Window
  if (prop === 'top') {
    return contentWindow
  }

  if (prop === 'parent') {
    if (val === contentWindow) {
      return contentWindow
    }

    // else, return the actual parent
    return currentWindow['prop']
  }
}
