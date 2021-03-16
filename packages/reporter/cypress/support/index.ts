import 'cypress-real-events/support'
// @ts-ignore
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'

installCustomPercyCommand({
  elementOverrides: {
    '.command-progress': true,
  },
})
