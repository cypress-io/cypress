import { mount } from '@cypress/vue'
import App from './App.vue'

describe('<App />', () => {
  beforeEach(() => {
    mount(() => <App />)
    cy.get('[data-cy=\'display\']').as('display')
  })

  function type (str: string) {
    const characters = str.split('')

    characters.forEach((s) =>
      cy
      .get('button')
      .filter((_, el) => el.innerText === s)
      .click())
  }

  it('Sets a number when typing 10', () => {
    type('10')
    cy.get('@display').should('contain', '10')
  })

  it('Sets a number when typing 28 and =', () => {
    type('28=')
    cy.get('@display').should('contain', '28')
  })

  it('ignores trainling 0 ', () => {
    type('010')
    cy.get('@display').should('not.contain', '010')
  })

  it('Sets a number when typing it', () => {
    type('35')
    cy.get('@display').should('contain', '35')
  })

  it('Adds two numbers when typing them with a + in the middle', () => {
    type('35+8=')
    cy.get('@display').should('contain', '43')
  })

  it('Substract two numbers when typing them with a - in the middle', () => {
    type('35-8=')
    cy.get('@display').should('contain', '27')
  })

  it('Chain additions', () => {
    type('35+8')
    cy.get('@display').should('contain', '8')
    type('+10')
    cy.get('@display').should('contain', '10')
    type('=')
    cy.get('@display').should('contain', '53')
  })

  it('Keep value for the next operation', () => {
    type('35+8')
    cy.get('@display').should('contain', '8')
    type('=')
    cy.get('@display').should('contain', '43')
    type('+10=')
    cy.get('@display').should('contain', '53')
  })

  it('Reset everything when clicking on AC', () => {
    type('35-8=')
    cy.get('button').contains('AC').click()
    cy.get('@display').should('contain', '0')
  })

  describe('negative', () => {
    it('displays a minus sign', () => {
      type('135')
      cy.get('button').contains('+/-').click()
      cy.get('@display').should('contain', '-135')
    })

    it('adds signed numbers', () => {
      type('135')
      cy.get('button').contains('+/-').click()
      type('+10=')
      cy.get('@display').should('contain', '-125')
    })

    it('adds signed numbers and chain on', () => {
      type('135')
      cy.get('button').contains('+/-').click()
      type('+10')
      cy.get('@display').should('contain', '10')
      type('+15')
      cy.get('@display').should('contain', '15')
      cy.get('@display').should('not.contain', '-')
      type('=')
      cy.get('@display').should('contain', '-110')
    })
  })

  describe('decimals', () => {
    it('should display decimals', () => {
      type('135.25')
      cy.get('@display').should('contain', '135.25')
    })

    it('should add decimals', () => {
      type('135.25+1.75=')
      cy.get('@display').should('contain', '137')
    })

    it('should respond to percent', () => {
      type('13525%')
      cy.get('@display').should('contain', '135.25')
    })

    it('should respond to display 5 percent ', () => {
      type('5%')
      cy.get('@display').should('contain', '0.05')
    })

    it('should respond to display 50 percent', () => {
      type('50%')
      cy.get('@display').should('contain', '0.5')
      cy.get('@display').should('not.contain', '00.50')
    })
  })
})
