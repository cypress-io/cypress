import Cell from '@/components/Cell'
import { mount } from '@cypress/vue'

describe('Cell', () => {
  beforeEach(() => {
    cy.viewport(30, 30)
  })

  describe('solved', () => {
    it('renders successfully with a letter and number', () => {
      const cellConfig = { letter: 'A', number: 1, showLetter: true }

      mount(Cell, { propsData: cellConfig })

      cy.get('[data-testid=cell]')
      .should('contain.text', cellConfig.number)

      cy.get('[data-testid=cell-input]')
      .should('contain.value', cellConfig.letter)
    })
  })

  describe('blacked out', () => {
    it('renders a blocked out cell when showLetter is set and its blocked out', () => {
      const cellConfig = { letter: '.', blockedOut: true, showLetter: true }

      mount(Cell, { propsData: cellConfig })

      cy.get('[data-testid=cell]').then((cell) => {
        expect(cell).to.have.class('blocked-out')
      })
    })

    it('renders a blocked out cell when the prop is set', () => {
      const cellConfig = { letter: '.', blockedOut: true }

      mount(Cell, { propsData: cellConfig })

      cy.get('[data-testid=cell]').then((cell) => {
        expect(cell).to.have.class('blocked-out')
      })
    })
  })

  describe('#showLetter', () => {
    it('when false, it does not render the letter', () => {
      const cellConfig = { letter: 'A', number: 1, showLetter: false }

      mount(Cell, { propsData: cellConfig })

      cy.get('[data-testid=cell-input]')
      .should('not.contain.value', cellConfig.letter)
    })
  })

  describe('input', () => {
    let spy

    beforeEach(() => {
      const cellConfig = {
        letter: 'A',
        showLetter: false,
        editable: true,
      }

      spy = cy.spy()

      mount(Cell, { propsData: cellConfig, listeners: { input: spy } })

      cy.get('[data-testid=cell-input]').as('input')
    })

    it('emits a new letter when edited', () => {
      cy.get('@input')
      .click()
      .type('B', { force: true })
      .then(() => {
        expect(spy).to.have.been.calledWith('B')
      })
    })

    it('only accepts one letter at a time', () => {
      cy.get('@input')
      .click()
      .type('B', { force: true })
      .type('D', { force: true })
      .should('have.value', 'D')
      .then(() => {
        expect(spy).to.have.been.calledWith('B')
        expect(spy).to.have.been.calledWith('D')
      })
      .clear({ force: true })
      .then(() => {
        expect(spy).to.have.been.calledWith('')
      })
    })
  })
})
