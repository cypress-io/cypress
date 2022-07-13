import { expectError, expectType } from './index'
import { mount, VueTestUtils } from '../dist'
import * as VTU from '@vue/test-utils'
import { defineComponent } from 'vue'

const App = defineComponent({
  template: `<div />`,
})

// Returns Chainable - not the `mount` function from @vue/test-utils
expectType<Cypress.Chainable>(
  mount(App),
)

// Rewritten relative types match those copied from node_modules
// see npm/vue/inline-types.ts for more info.
expectType<typeof VueTestUtils['config']['global']>(VTU['config']['global'])
