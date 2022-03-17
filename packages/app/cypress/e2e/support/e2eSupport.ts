import '@packages/frontend-shared/cypress/e2e/support/e2eSupport'
import 'cypress-real-events/support'
import { registerInCypress } from '../../plugins/snapshot/snapshotCommand'

registerInCypress()
