import { initialize } from '@packages/driver/src/multidomain'

const autWindow = window.parent.frames[0]

const { cy } = initialize(autWindow)

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
