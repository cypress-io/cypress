// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these tsconfig compiler paths
import { defaultMessages } from '@cy/i18n'
import { registerMountFn, addVueCommand } from './common'
import '../../src/styles/shared.scss'
import 'tailwindcss/tailwind.css'
import 'cypress-real-events/support'
import './browserIconCommands'
import { installCustomPercyCommand } from './customPercyCommand'
import { addNetworkCommands } from './onlineNetwork'
import { GQLStubRegistry } from './mock-graphql/stubgql-Registry'

import { createPinia } from '../../src/store'
import { setActivePinia } from 'pinia'
import type { Pinia } from 'pinia'

let pinia: Pinia

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})

declare global {
  namespace Cypress {
    interface Chainable {
      gqlStub: typeof GQLStubRegistry
      /**
       * Verify that the subject is within the bounds of the root viewport and not hidden outside a root scroll pane
       * Note that this does not consider the condition of nested scrollpanes, so the subject could be within the root
       * pane but hidden outside of a child pane.
       */
      validateWithinViewport(): Chainable<JQuery<HTMLElement>>
    }
  }
}
cy.i18n = defaultMessages
cy.gqlStub = GQLStubRegistry

function logInternal<T> (name: string | Partial<Cypress.LogConfig>, cb: (log: Cypress.Log | undefined) => Cypress.Chainable<T>, opts: Partial<Cypress.Loggable> = {}): Cypress.Chainable<T> {
  const _log = typeof name === 'string'
    ? Cypress.log({ name, message: '' })
    : Cypress.log(name)

  return cb(_log).then<T>((val) => {
    _log?.end()

    return val
  })
}

function validateWithinViewport (subject: JQuery<HTMLElement>): Cypress.Chainable<JQuery<HTMLElement>> {
  function areFullyOverlapping (elementBounds: DOMRect, scrollBounds: DOMRect) {
    const isBoundedLeft = elementBounds.right <= scrollBounds.right
    const isBoundedRight = elementBounds.left >= scrollBounds.left
    const isBoundedTop = elementBounds.bottom <= scrollBounds.bottom
    const isBoundedBottom = elementBounds.top >= scrollBounds.top

    return isBoundedLeft && isBoundedRight && isBoundedTop && isBoundedBottom
  }

  function _validateWithinViewport () {
    /* Naive implementation - does not consider nested scroll containers, only checks root container bounds */
    cy.document({ log: false }).then((doc) => {
      // Build rectangle reflecting bounds of root scroll container (or body if not scrollable)
      const rootViewport = doc.scrollingElement ?? doc.body
      const docBounds = new DOMRect(0, 0, rootViewport.clientWidth, rootViewport.clientHeight)

      const element = subject[0]
      const elementBounds = element.getBoundingClientRect()

      // Validate that element and root viewport fully overlap
      const overlapping = areFullyOverlapping(elementBounds, docBounds)

      expect(overlapping).to.equal(true, 'Expected element to be fully within viewport bounds')
    })

    return cy.wrap(subject, { log: false })
  }

  return logInternal('validateWithinViewport', () => {
    return _validateWithinViewport()
  })
}

Cypress.Commands.add('validateWithinViewport', { prevSubject: true }, validateWithinViewport)

Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop completed with undelivered notifications.'))

registerMountFn()
addVueCommand()
installCustomPercyCommand({
  elementOverrides: {
    'svg.animate-spin': ($el) => {
      $el.attr('style', 'animation: none !important')
    },
  },
})

addNetworkCommands()
