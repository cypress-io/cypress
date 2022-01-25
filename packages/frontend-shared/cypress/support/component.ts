import { defaultMessages } from '@cy/i18n'
import { registerMountFn, addVueCommand } from './common'
import '../../src/styles/shared.scss'
import 'virtual:windi.css'
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'
import { addNetworkCommands } from './onlineNetwork'
import { GQLStubRegistry } from './mock-graphql/stubgql-Registry'

declare global {
  namespace Cypress {
    interface Chainable {
      gqlStub: typeof GQLStubRegistry
    }
  }
}

cy.i18n = defaultMessages
cy.gqlStub = GQLStubRegistry

registerMountFn()
addVueCommand()
installCustomPercyCommand()
addNetworkCommands()
