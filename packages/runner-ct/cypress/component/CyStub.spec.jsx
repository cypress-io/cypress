const React = require('react')
const { mount } = require('@cypress/react')
const { CyStub } = require('./CyStub.jsx')
const AuthProvider = require('./auth.js')

describe('cy.stub', () => {
  let calls = 0

  beforeEach(() => {
    cy.stub(AuthProvider, 'login').callsFake(() => {
      calls += 1
    })
  })

  it('should stub commonjs require', () => {
    mount(<CyStub />)
    cy.get('button').click().then(() => {
      expect(calls).to.eq(1)
    })
  })
})
