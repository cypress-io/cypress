/* eslint-env mocha,chai,jest */
/* globals cy */

import HelloWorld from './HelloWorld'
import { mount } from '@cypress/vue'

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
