/// <reference types="cypress" />
import { asyncGreeting } from './greeting'

export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  on('task', {
    hello: asyncGreeting,
  })
}
