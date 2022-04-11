import { mount } from '@cypress/vue2'

/* eslint-env mocha */
describe('document.body', () => {
  it('is set correctly', () => {
    mount({
      mounted () {
        console.log('mounted!')
        console.log('document.body', document.body)
        document.body.innerText = 'Mounted!'
      },
    })

    cy.contains('Mounted!').should('be.visible')
  })
})
