import type {} from '@packages/frontend-shared/src/graphql/urqlClient'
import 'setimmediate'

import './config/bluebird'
import './config/jquery'
import './config/lodash'
import $Cypress from './cypress'
import { telemetry } from '@packages/telemetry/src/browser'

telemetry.init({ prefix: 'cypress:driver', context: window.__CYPRESS_TELEMETRY_CONTEXT__ })

export default $Cypress
