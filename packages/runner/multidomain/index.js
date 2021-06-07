import { initialize } from '@packages/driver/src/multidomain'

initialize(window.parent.frames[0])

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
