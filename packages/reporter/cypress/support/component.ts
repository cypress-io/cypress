// tslint:disable-next-line:no-implicit-dependencies - cypress
import { mount } from 'cypress/react'
import 'cypress-real-events/support'
import { installCustomPercyCommand } from '@packages/frontend-shared/cypress/support/customPercyCommand'

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
