require('cypress-react-unit-test/support')
require('@cypress/code-coverage/support')

import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'
addMatchImageSnapshotCommand()
