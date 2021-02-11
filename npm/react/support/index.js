// should be loaded from cypress.json as a support file
// "supportFile": "node_modules/@cypress/react/support"
// adds commands from @cypress/react
require('../dist/hooks').setupHooks()
require('cypress-react-selector')
require('@cypress/code-coverage/support')
