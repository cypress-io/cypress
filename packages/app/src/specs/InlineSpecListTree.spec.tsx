import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/buildSpecTree'
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

    cy.get('li').should('have.length', 7).first().focus().type('{enter}')
    cy.get('li').should('have.length', 1).type('{enter}').focused().type('{downarrow}').focused().type('{enter}')
    cy.get('li').should('have.length', 4)

    cy.then(() => {
      specProp.value = foundSpecs.slice(0, 3)
    })
  })

  it('should collapse and rebuild tree on specs change', () => {
    const specProp = ref(foundSpecs.slice(0, 3))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.get('li').first().should('contain', 'src/components')
    cy.then(() => specProp.value = foundSpecs.slice(0, 4))
    cy.get('li').should('have.length', 7).first().should('contain', 'src').and('not.contain', '/components')
  })
})
