import { registerMountFn, addVueCommand } from './common'
import '../../src/styles/shared.scss'
import 'virtual:windi.css'
import 'cypress-real-events/support'
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'
import { addNetworkCommands } from './onlineNetwork'

Cypress.on('uncaught:exception', (err) => !err.message.includes('ResizeObserver loop limit exceeded'))

registerMountFn()
addVueCommand()
installCustomPercyCommand()
addNetworkCommands()
