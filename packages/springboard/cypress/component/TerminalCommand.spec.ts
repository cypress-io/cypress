import { mount } from '@cypress/vue'
import { defineComponent, h } from '@vue/runtime-core'
import 'windi.css'

import TerminalCommand from '../../src/components/TerminalCommand.vue'

describe('TerminalCommand', () => {
  beforeEach(() => {
    cy.viewport(1000, 100)
  })

  it('renders a short command', () => {
    mount(TerminalCommand, {
      props: {
        command: 'yarn add @cypress/react --dev',
      },
    })
  })

  it('renders a long command', () => {
    const Wrap = defineComponent({
      setup () {
        return () => {
          return h('div', { style: 'max-width: 300px' }, h(TerminalCommand, {
            command: 'yarn add @cypress/webpack-dev-server @cypress/react this-is-some-really-long-command --dev',
          }))
        }
      },
    })

    mount(Wrap)
  })
})
