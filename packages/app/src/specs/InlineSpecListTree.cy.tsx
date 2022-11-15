import type { FuzzyFoundSpec } from './spec-utils'
import { ref } from 'vue'
import { useSpecStore } from '../store'
import InlineSpecListTree from './InlineSpecListTree.vue'

describe('InlineSpecListTree', () => {
  let foundSpecs: FuzzyFoundSpec[]

  before(() => {
    cy.fixture('found-specs').then((specs) => foundSpecs = specs.map((spec) => ({ ...spec, indexes: [] })))
  })

  it('handles keyboard navigation', () => {
    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.findAllByTestId('spec-row-item').should('have.length', 7).first().click().type('{enter}')
    cy.findAllByTestId('spec-row-item').should('have.length', 1).focused().type('{rightarrow}')
    .focused().type('{downarrow}').focused().type('{enter}')

    cy.findAllByTestId('spec-row-item').should('have.length', 4)
  })

  it('collapses and rebuilds tree on specs change', () => {
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

  it('displays a spec list tree with an active spec', () => {
    const specStore = useSpecStore()

    specStore.setActiveSpec({
      relative: 'src/components/Spec-B.spec.tsx',
      absolute: '',
      name: 'src/components/Spec-B.spec.tsx',
      fileName: 'src/components/Spec-B.spec.tsx',
      baseName: 'Spec-B.spec.tsx',
    })

    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.get('[data-selected-spec="true"] span').should('contain', 'Spec-B').should('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-selected-spec="false"]').should('have.length', '6')
    .should('contain', 'src')
    .should('contain', 'components')
    .should('contain', 'Spec-A')
    .should('contain', 'Spec-C')
    .should('contain', 'utils')
    .and('contain', 'Spec-D')

    cy.percySnapshot()
  })

  it('displays runAllSpecs when hovering over a spec-list directory row', () => {
    const specProp = ref(foundSpecs.slice(0, 4))

    cy.mount(() => (
      <div class="bg-gray-1000">
        <InlineSpecListTree specs={specProp.value}/>
      </div>
    ))

    cy.findAllByTestId('directory-item').first()
    .trigger('mouseenter').then(() => {
      cy.get('[data-cy="play-button"]').should('exist')
      cy.get('[data-cy="run-all-specs"]')
      .realHover().then(() => {
        cy.findByTestId('tooltip-content').should('contain.text', 'Run 48 specs')
      })
    })

    cy.findAllByTestId('spec-file-item').first()
    .trigger('mouseenter').then(() => {
      cy.get('[data-cy="run-all-specs"]')
      .should('not.exist')
    })
  })
})

// To do: Test that run-all specs shows up with the correct number of specs on hover and not just a default value
// To do: Test that this only shows up in E2E testing
