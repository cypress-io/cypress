import InlineSpecListRow from './InlineSpecListRow.vue'
import type { FuzzyFoundSpec } from '@packages/frontend-shared/src/utils/buildSpecTree'

describe('InlineSpecListRow', () => {
  let specs: FuzzyFoundSpec[]

  before(() => {
    cy.fixture('found-specs').then((foundSpecs) => specs = foundSpecs.map((spec) => ({ ...spec, indexes: [] })))
  })

  it('should handle keyboard navigation', () => {
    cy.mount(() =>
      (<div class="bg-gray-1000">
        {specs.slice(0, 3).map((spec) => (<InlineSpecListRow data-cy="row" spec={spec} selected={false}/>))}
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
    const spec = specs[0]
    const relativeFolder = spec.relative.replace(`/${spec.baseName}`, '')

    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListRow data-cy="row" spec={spec} selected={false}/>
      </div>))

    cy.findByText(relativeFolder).should('not.be.visible')
    cy.get('a').realHover().findByText(relativeFolder).should('be.visible')
  })
})
