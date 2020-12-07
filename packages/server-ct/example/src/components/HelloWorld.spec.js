/* eslint-env mocha,chai,jest */

// import '../main'
import HelloWorld from './HelloWorld'
import { mount } from '@vue/test-utils'
import Vue from 'vue'
// import Vue from 'vue'

Vue.config.productionTip = false

describe('hello', () => {
  it('works', async () => {
    mount(HelloWorld, {
      attachTo: '#__cy_app',
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })

  it('works again', async () => {
    mount(HelloWorld, {
      attachTo: '#__cy_app',
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })
})
