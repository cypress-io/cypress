/* eslint-env mocha,chai,jest */
/* global cy */
// import '../main'
import HelloWorld from './HelloWorld'
import { mount } from '@cypress/vue'
import Vue from 'vue'

Vue.config.productionTip = false

describe('Prettiest', () => {
  it('spec works!', () => {
    mount(HelloWorld, {
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })

  it('spec works again', () => {
    mount(HelloWorld, {
      propsData: {
        msg: 'Hello World!',
      },
    })

    cy.get('h1').contains('Hello World!')
  })
})
