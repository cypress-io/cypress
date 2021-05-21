import $Cypress from '@packages/driver/src/cypress'
import $Cy from '@packages/driver/src/cypress/cy'
import $Commands from '@packages/driver/src/cypress/commands'
import $Log from '@packages/driver/src/cypress/log'

const autWindow = window.parent.frames[0]
const specWindow = {
  Error,
}
const Cypress = $Cypress.create({
  browser: {
    channel: 'stable',
    displayName: 'Chrome',
    family: 'chromium',
    isChosen: true,
    isHeaded: true,
    isHeadless: false,
    majorVersion: 90,
    name: 'chrome',
    path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    version: '90.0.4430.212',
  },
})
const log = (...args) => {
  return Cypress.log.apply(this, args)
}
const cy = $Cy.create(specWindow, Cypress, Cypress.Cookies, Cypress.state, Cypress.config, log)

Cypress.log = $Log.create(Cypress, cy, Cypress.state, Cypress.config)
Cypress.runner = {
  addLog () {},
}

Cypress.state('window', autWindow)
Cypress.state('document', autWindow.document)
Cypress.state('runnable', {
  ctx: {},
  clearTimeout () {},
  resetTimeout () {},
  timeout () {},
})

$Commands.create(Cypress, cy, Cypress.state)

autWindow.onReady = () => {
  cy.now('get', 'p').then(($el) => {
    // eslint-disable-next-line no-console
    console.log('got the paragaph with text:', $el.text())
  })
}

/*

Need:
- Cypress
- cy, with
  - built-in commands
  - user-defined commands

Commands need:
- state
- config
- events

Don't need:
- UI components
- spec runner
- mocha
- wasm / source map utils

*/
