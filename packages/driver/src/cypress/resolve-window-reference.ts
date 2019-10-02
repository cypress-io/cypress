import _ from 'lodash'
import $Cypress from '../..'
import AutIframe from '../../../runner/src/iframe/aut-iframe'

interface State {
  (k: '$autIframe', v?: AutIframe): Optional<AutIframe>
}

declare const Cypress : typeof $Cypress

const { dom } = Cypress

const state = Cypress.state as State

export function resolveWindowReference (currentWindow: Window, maybeWindow: Window | any, prop: string) {
  const val = maybeWindow[prop]

  if (!dom.isWindow(val) || dom.isJquery(val)) {
    if (_.isFunction(val)) {
      return val.bind(maybeWindow)
    }

    return val
  }

  const $autIframe = state('$autIframe')

  // val is a reference to a Window
  if (prop === 'top') {
    return
  }
}
