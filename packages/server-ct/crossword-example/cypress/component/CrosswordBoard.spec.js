/// <reference types="cypress" />
import CrosswordBoard from '@/components/CrosswordBoard'
import { mount } from '@cypress/vue'
import crosswords from '../fixtures/crosswords'
const { crossword: bigCrossword, helloWorld: crossword } = crosswords

describe('CrosswordBoard', () => {
  it('requires a crossword', () => {
    expect(() => mount(CrosswordBoard)).to.throw
  })

  describe('smaller board', () => {
    describe('successfully renders', () => {
      beforeEach(() => {
        mount(CrosswordBoard, {
          propsData: {
            crossword,
            solved: true,
          },
        }).then(() => {
          cy.get('[data-testid=crossword]').as('board')
          cy.get('[data-testid=crossword] [data-testid=cell]').as('cells')
          cy.get('[data-testid=crossword] [data-testid=row]').as('rows')
        })
      })

      it('has a crossword puzzle', () => {
        const wrapper = Cypress.vueWrapper

        expect(wrapper.props('crossword')).to.exist
        expect(wrapper.props('crossword')).to.be.a('object')
      })

      it('renders the crossword puzzle successfully', () => {
        cy.get('@cells').should('have.length', crossword.grid.length)
      })

      it('doesnt contain any placeholder dots', () => {
        cy.get('@board').should('not.contain.text', '.')
      })

      it('numbers the crossword puzzle correctly', () => {
        cy.get('@cells').then((cells) => {
          Array.from(cells).forEach((c, idx) => {
            if (crossword.gridnums[idx] > 0) {
              expect(c).to.contain.text(crossword.gridnums[idx])
            } else {
              expect(c).not.to.contain.text(0)
            }
          })
        })
      })

      it('renders the correct number of rows and columns', () => {
        cy.get('@rows')
        .should('have.length', crossword.size.rows)

        cy.get('@rows').find('input').should('have.value', crossword.grid[0])
      })
    })
  })

  describe('larger board', () => {
    describe('solved', () => {
      it('renders successfully', () => {
        mount(CrosswordBoard, {
          propsData: { crossword: bigCrossword, solved: true },
        })

        expect(Cypress.vueWrapper).to.exist
      })
    })

    describe('unsolved', () => {
      it('renders successfully', () => {
        mount(CrosswordBoard, {
          propsData: { crossword: bigCrossword, solved: false },
        })

        expect(Cypress.vueWrapper).to.exist
      })
    })
  })
})
