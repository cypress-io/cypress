import {
  injectStylesBeforeElement,
  getContainerEl,
  setupHooks,
} from '@cypress/mount-utils'
import { render } from 'solid-js/web'

export interface MountOptions {
  log?: boolean
}

import type { JSX } from 'solid-js'

let cleanup: () => void = () => {}

export function mount (comp: () => JSX.Element, options: MountOptions = {}) {
  return cy.then(() => {
    if (cleanup)cleanup()

    const target = getContainerEl()

    injectStylesBeforeElement(options, document, target)

    cleanup = render(comp, target)

    // by waiting, we are delaying test execution for the next tick of event loop
    // and letting hooks and component lifecycle methods to execute mount
    return cy
    .wait(0, { log: false })
    .then(() => {
      if (options.log !== false) {
        const mountMessage = `mount ...`

        Cypress.log({
          name: 'mount',
          message: [mountMessage],
        })
        .snapshot('mounted')
        .end()
      }
    })
    .wrap({}, { log: false })
  })
}

// Side effects from "import { mount } from '@cypress/<my-framework>'" are annoying, we should avoid doing this
// by creating an explicit function/import that the user can register in their 'component.js' support file,
// such as:
//    import 'cypress/<my-framework>/support'
// or
//    import { registerCT } from 'cypress/<my-framework>'
//    registerCT()
// Note: This would be a breaking change
setupHooks(cleanup)
