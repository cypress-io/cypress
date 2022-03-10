import '@packages/frontend-shared/cypress/e2e/support/e2eSupport'

import { installCustomPercyCommand } from '@packages/ui-components/cypress/support/customPercyCommand'

// @ts-ignore
installCustomPercyCommand({
  elementOverrides: {
    // @ts-ignore
    '.runnable-header .duration': ($el) => $el.text('XX:XX'),
  },
})

import 'cypress-real-events/support'
