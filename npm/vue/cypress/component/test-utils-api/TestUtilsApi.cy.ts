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

  it('errors when attempting to access Vue Wrapper without destructuring', () => {
    mount(TestUtilsApi, { props: { msg: 'Hello world!' } }).then((vueWrapper) => {
      // @ts-expect-error - these are removed
      expect(() => vueWrapper.vm).to.throw('As of Cypress 11, mount now yields an object with VueWrapper as a property. Destructure using `{ wrapper }` to access the VueWrapper.')
      // @ts-expect-error - these are removed
      expect(() => vueWrapper.find('h2').text()).to.throw('As of Cypress 11, mount now yields an object with VueWrapper as a property. Destructure using `{ wrapper }` to access the VueWrapper.')
    })
  })
})
