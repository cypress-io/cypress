import {mount} from 'cypress-vue-unit-test'

/* eslint-env mocha */
describe('document.body', () => {
  // https://github.com/bahmutov/cypress-vue-unit-test/issues/122
  it('is set correctly', () => {
    mount({
      mounted () {
        console.log('mounted!')
        console.log('document.body', document.body)
        document.body.innerText = 'Mounted!'
      }
    })
    cy.contains('Mounted!').should('be.visible')
  })
})
