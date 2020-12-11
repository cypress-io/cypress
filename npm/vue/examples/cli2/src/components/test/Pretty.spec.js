/* eslint-env mocha,chai,jest */

import HelloWorld from '../HelloWorld'
import { mount } from '@cypress/vue'

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
