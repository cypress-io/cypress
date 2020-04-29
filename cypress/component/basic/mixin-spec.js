import {mountCallback} from 'cypress-vue-unit-test'

/* eslint-env mocha */
describe('Global mixin', () => {
  const MyMixin = {
    // we have to use original Sinon to create a spy
    // because we are outside a test function
    // and cannot use "cy.spy"
    created: Cypress.sinon.spy()
  }
  const mixin = [MyMixin]
  // extend Vue with mixins
  const extensions = {
    mixin
  }
  beforeEach(mountCallback({}, { extensions }))

  it('calls mixin "created" method', () => {
    expect(MyMixin.created).to.have.been.calledOnce
  })
})
