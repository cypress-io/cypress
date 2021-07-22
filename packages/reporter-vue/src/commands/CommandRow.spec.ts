import { h } from 'vue'
import _ from 'lodash'
import IconEyeSlash from 'virtual:vite-icons/fa/eye-slash'
import CommandRow from './CommandRow.vue'

it('renders a command row', () => {
  cy.mount(CommandRow, {
    slots: {
      name() {
        return 'get'
      },
      message() {
        return '#exists'
      },
      position() { return 1 },
      meta() {
        return h(IconEyeSlash, { style: { width: '12px', height: '12px' }})
      },
    }
  })
})
