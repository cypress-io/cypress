/// <reference types="cypress" />
import { mount, mountCallback } from 'cypress-vue-unit-test'

describe('Mixins', () => {
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
    beforeEach(mountCallback({}, { extensions }))

    it('calls mixin "created" method', () => {
      expect(MyMixin.created).to.have.been.calledOnce
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
      mount({}, { extensions })
      // use the alias to retrieve the stub to check
      cy.get('@created').should('have.been.calledOnce')
    })
  })
})
