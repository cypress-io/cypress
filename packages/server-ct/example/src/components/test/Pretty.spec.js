/* eslint-env mocha,chai,jest */

// import '../main'
import HelloWorld from '../HelloWorld'
import { mount } from '@cypress/vue'
import Vue from 'vue'

Vue.config.productionTip = false

describe('Pretty', () => {
  it('spec works', () => {
    mount(HelloWorld, {
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })
})
