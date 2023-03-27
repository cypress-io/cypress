import 'setimmediate'

import './config/bluebird'
import './config/jquery'
import './config/lodash'
import $Cypress from './cypress'
import { telemetry } from '@packages/telemetry/src/browser'

// Telemetry has already been initialized in the 'app' package
// but since this is a different package we have to link up the instances.
telemetry.attach()

export default $Cypress
