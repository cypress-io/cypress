import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'

require('@cypress/react/support')
require('@cypress/code-coverage/support')
addMatchImageSnapshotCommand()
