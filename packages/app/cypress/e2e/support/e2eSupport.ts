import '@packages/frontend-shared/cypress/e2e/support/e2eSupport'
import 'cypress-real-events/support'
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'

installCustomPercyCommand({
  before: () => {},
  elementOverrides: {
    '.runnable-header .duration': ($el) => $el.text('XX:XX'),
    '.cy-tooltip': true,
    'iframe.aut-iframe': true,
    '#spec-runner-header': true,
  },
})
