import CrosswordSkeleton from '@/components/CrosswordSkeleton'
import { mount } from '@cypress/vue'
import crosswords from '../fixtures/crosswords'

describe('CrosswordSkeleton', () => {
  it('renders successfully', () => {
    mount(CrosswordSkeleton, {
      propsData: { crossword: crosswords.oneByTwo },
    })

    cy.get('[data-testid=crossword-skeleton]').then((el) => expect(el).to.exist)
    cy.get('[data-testid=crossword-skeleton] .cell').should('have.length', crosswords.oneByTwo.cells.length)

    mount(CrosswordSkeleton)
    cy.get('[data-testid=crossword-skeleton]').then((el) => expect(el).to.exist)
    cy.get('[data-testid=crossword-skeleton] .cell').should('not.have.length', crosswords.oneByTwo.cells.length)
  })
})
