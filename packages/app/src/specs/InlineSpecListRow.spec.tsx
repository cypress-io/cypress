import type { FoundSpec } from '@packages/types/src'
import InlineSpecListRow from './InlineSpecListRow.vue'

describe('InlineSpecListRow', () => {
  const specFileExtension = '.spec.tsx'
  const relativeFolder = 'src/components'
  const specs: FoundSpec[] = ['Spec-A', 'Spec-B', 'Spec-C'].map((fileName) => {
    const baseName = fileName + specFileExtension

    return {
      baseName,
      fileName,
      specFileExtension,
      relative: `${relativeFolder}/${baseName}`,
      absolute: '',
      fileExtension: '.tsx',
      specType: 'component',
      name: '',
    }
  })

  it('should handle keyboard navigation', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000">
        {specs.map((spec) => (<InlineSpecListRow data-cy="row" spec={spec} selected={false}/>))}
      </div>))

    cy.get('a')
    .first()
    .focus()
    .type('{downarrow}')
    .focused()
    .contains('Spec-B')
    .type('{uparrow}')
    .focused()
    .contains('Spec-A')
    .type('{uparrow}')
    .focused()
    .contains('Spec-C')
    .type('{downarrow}')
    .focused()
    .contains('Spec-A')
  })

  it('should show relative path on hover', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListRow data-cy="row" spec={specs[0]} selected={false}/>
      </div>))

    cy.findByText(relativeFolder).should('not.be.visible')
    cy.get('a').realHover().findByText(relativeFolder).should('be.visible')
  })
})
