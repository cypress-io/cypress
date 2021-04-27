import $Commands from '@packages/driver/src/cypress/commands'
import addLocalStorageCommands from '@packages/driver/src/cy/commands/local_storage'

const autWindow = window.parent.frames[0]

const Cypress = {
  prependListener () {},
  log () {},
}
const cy = {
  addCommand ({ name, fn }) {
    cy[name] = fn
  },
}
const state = (key) => {
  if (key === 'window') {
    return autWindow
  }
}
const Commands = $Commands.create(Cypress, cy, state)

addLocalStorageCommands(Commands, Cypress, cy, state)

autWindow.onReady = () => {
  cy.clearLocalStorage()
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
