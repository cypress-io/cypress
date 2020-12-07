/* eslint-env mocha,chai,jest */

import HelloWorld from './HelloWorld'
import { mount } from '@cypress/vue'
import Vue from 'vue'

Vue.config.productionTip = false

describe('hello', () => {
  it('works!', () => {
    mount(HelloWorld, {
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })

  it('works again', () => {
    mount(HelloWorld, {
      propsData: {
        msg: 'Hello World Again!',
      },
    })

    cy.get('h1').contains('Hello World Again!')
  })
})
