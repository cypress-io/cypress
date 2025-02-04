/// <reference types="cypress" />
import { mount } from '@cypress/vue'

describe('Mixins', () => {
  const template = '<div>mixin test</div>'

  context('Global mixin', () => {
    const MyMixin = {
      // we have to use original Sinon to create a spy
      // because we are outside of test function
      // and cannot use "cy.stub"
      created: Cypress.sinon.stub(),
    }
    const mixin = [MyMixin]
    // extend Vue with mixins
    const extensions = {
      mixin,
    }

    it('calls mixin "created" method', () => {
      mount({ template }, { extensions }).then(() => {
        // the "created" will be called twice
        // 1 - when the test wrapper element made by the Vue test utils is created
        // 2 - when the element above we are testing is created
        expect(MyMixin.created).to.have.been.calledTwice
      })
    })
  })

  context('local to test', () => {
    it('is created', () => {
      const LocalMixin = {
        // we are inside a test, thus can use
        // https://on.cypress.io/stub to create a function
        created: cy.stub().as('created'),
      }
      const mixin = [LocalMixin]
      const extensions = {
        mixin,
      }

      mount({ template }, { extensions })
      // use the alias to retrieve the stub to check
      // the "created" will be called twice
      // 1 - when the test wrapper element made by the Vue test utils is created
      // 2 - when the element above we are testing is created
      cy.get('@created').should('have.been.calledTwice')
    })
  })
})
