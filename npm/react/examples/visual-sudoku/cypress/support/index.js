import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'

require('cypress-react-unit-test/support')
require('@cypress/code-coverage/support')
addMatchImageSnapshotCommand()
