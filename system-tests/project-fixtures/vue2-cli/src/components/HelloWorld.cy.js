import { mount } from 'cypress/vue2'
import HelloWorld from './HelloWorld.vue'

describe('<Logo />', () => {
  it('contains the default slot in its h1', () => {
    const slotContent = 'Welcome to testing in Vue CLI'

    mount(HelloWorld, {
      propsData: {
        msg: slotContent,
      },
      data () {
        return {
          foo: 'bar'
        }
      }
    })
    .then(({ wrapper, component }) => {
      expect(wrapper.find('.hello').text()).to.contain(slotContent)
      expect(component.$data.foo).to.eq('bar')
    })

    cy.contains('h1', slotContent)
  })
})
