import { mount } from '@cypress/vue'
import { defineComponent, h } from 'vue'

describe('hello', () => {
  it('works', () => {
    const random = Math.random() * 10000
    const str = `Today's random number is ${random.toFixed()}`
    const Comp = defineComponent({
      render () {
        return h('div', {
          style: {
            background: random % 2 === 0 ? 'green' : 'blue',
            color: 'white',
            padding: '10px',
          },
        }, str)
      },
    })

    mount(Comp).then(() => {
      cy.get('div').contains(str)
    })

    expect(1).to.eq(1)
  })
})
