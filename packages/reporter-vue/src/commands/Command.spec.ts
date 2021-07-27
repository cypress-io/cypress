import Command from './Command.vue'
import { defineComponent, h } from 'vue'
import _ from 'lodash'
import * as commandExports from '@packages/faker/commands'

const commandStubs = _.filter(commandExports, _.isPlainObject)
const style = {
  resize: 'horizontal',
  overflow: 'auto',
  maxWidth: '300px'
}

it('renders a passed command', () => {
  const allCommands = defineComponent({
    setup() {
      return () => {
        return h('div', { style }, _.map(commandStubs, command => {
          return h('div', { style }, [h(Command, {
            command: command,
            size: 'lg',
            idx: 0
          })])
        }))
      }
    }
  })
  cy.mount(allCommands, {
    props: {
      style: { ...style, margin: '2rem auto', }
    }
  })
})

