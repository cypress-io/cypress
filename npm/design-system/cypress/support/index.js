import 'regenerator-runtime/runtime'
import 'cypress-real-events/support'
import '@percy/cypress'
import './storybook'

// Need to register these once per app. Depending which components are consumed
// from @cypress/design-system, different icons are required.
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)
library.add(fab)
