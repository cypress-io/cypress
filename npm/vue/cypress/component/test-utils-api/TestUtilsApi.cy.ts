import { VueTestUtils, mount } from 'cypress/vue'
import { h } from 'vue'
import TestUtilsApi from './TestUtilsApi.vue'

const greeting = 'This is a globally registered component!'

describe('VueTestUtils API', () => {
  before(() => {
    VueTestUtils.config.global.components = {
      'globally-registered-component': {
        setup () {
          return () => h('h1', greeting)
        },
      },
    }
  })

  it('gains access to underlying Vue Test Utils library', () => {
    mount(TestUtilsApi)

    cy.get('h1').contains(greeting)
  })

  it('accesses wrapper and component', () => {
    mount(TestUtilsApi, { props: { msg: 'Hello world!' } }).then(({ component, wrapper }) => {
      expect(wrapper.find('h2').text()).to.eq('Hello world!')
      expect(component.msg).to.eq('Hello world!')
      expect(component.$data.foo).to.eq('bar')
    })
  })
})
