import InlineSpecListHeader from './InlineSpecListHeader.vue'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'

describe('InlineSpecListHeader', () => {
  const mountWithResultCount = (resultCount = 0) => {
    const specFilterModel = ref('')
    const onNewSpec = cy.spy().as('new-spec')

    cy.wrap(specFilterModel).as('specFilterModel')

    const methods = {
      'onUpdate:specFilterModel': (val: string) => {
        specFilterModel.value = val
      },
      onNewSpec,
    }

    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListHeader {...methods} specFilterModel={specFilterModel.value} resultCount={resultCount} />
      </div>))
  }

  it('should allow search', () => {
    mountWithResultCount(0)
    const searchString = 'my/component.cy.tsx'

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    // `force` necessary due to the field label being overlaid on top of the input
    .type(searchString, { delay: 0, force: true })
    .get('@specFilterModel').its('value').should('eq', searchString)
  })

  it('should emit add spec', () => {
    mountWithResultCount(0)
    cy.findAllByLabelText(defaultMessages.specPage.newSpecButton)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })

  it('clears search field when clear button is clicked', () => {
    mountWithResultCount(0)

    cy.findByTestId('clear-search-button')
    .should('not.exist')

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    // `force` necessary due to the field label being overlaid on top of the input
    .type('abcd', { delay: 0, force: true })
    .get('@specFilterModel').its('value').should('eq', 'abcd')

    cy.findByTestId('clear-search-button').click()
    cy.get('@specFilterModel').its('value').should('eq', '')
  })

  it('exposes the result count correctly to assistive tech', () => {
    mountWithResultCount(0)
    cy.contains('No matches')
    .should('have.class', 'sr-only')
    .and('have.attr', 'aria-live', 'polite')

    mountWithResultCount(1)
    cy.contains('1 match').should('have.class', 'sr-only')
    mountWithResultCount(100)
    cy.contains('100 matches').should('have.class', 'sr-only')
  })
})
