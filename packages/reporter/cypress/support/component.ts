import { mount } from 'cypress/react'
import 'cypress-real-events/support'
import { installCustomPercyCommand } from '@packages/ui-components/cypress/support/customPercyCommand'

import '../../src/main.scss'

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)
installCustomPercyCommand()
