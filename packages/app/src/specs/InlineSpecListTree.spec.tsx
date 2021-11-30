import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/spec-utils'
import { ref } from 'vue'
import InlineSpecListTree from './InlineSpecListTree.vue'

describe('InlineSpecListTree', () => {
  let foundSpecs: FuzzyFoundSpec[]

  before(() => {
    cy.fixture('found-specs').then((specs) => foundSpecs = specs.map((spec) => ({ ...spec, indexes: [] })))
  })

  it('should handle keyboard navigation', () => {
    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.findAllByTestId('spec-row-item').should('have.length', 7).first().focus().type('{enter}')
    cy.findAllByTestId('spec-row-item').should('have.length', 1).type('{enter}').focused().type('{downarrow}').focused().type('{enter}')
    cy.findAllByTestId('spec-row-item').should('have.length', 4)
  })

  it('should collapse and rebuild tree on specs change', () => {
    const specProp = ref(foundSpecs.slice(0, 3))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.findByTestId('directory-item').should('contain', 'src/components')
    cy.findAllByTestId('spec-file-item').should('have.length', specProp.value.length)

    cy.then(() => {
      specProp.value = foundSpecs.slice(0, 4)
      cy.findAllByTestId('directory-item').first().should('contain', 'src').and('not.contain', '/components')
      cy.findAllByTestId('spec-file-item').should('have.length', specProp.value.length)
    })
  })
})
