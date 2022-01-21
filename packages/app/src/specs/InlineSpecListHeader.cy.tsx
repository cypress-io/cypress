import InlineSpecListHeader from './InlineSpecListHeader.vue'
import { ref } from 'vue'
import { defaultMessages } from '@cy/i18n'

describe('InlineSpecListHeader', () => {
  const mountWithResultCount = (resultCount = 0) => {
    const search = ref('')
    const onNewSpec = cy.spy().as('new-spec')

    cy.wrap(search).as('search')

    const methods = {
      search: search.value,
      'onUpdate:search': (val: string) => {
        search.value = val
      },
      onNewSpec,
    }

    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListHeader {...methods} resultCount={resultCount} />
      </div>))
  }

  it('should allow search', () => {
    mountWithResultCount(0)
    const searchString = 'my/component.cy.tsx'

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    .type(searchString, { delay: 0, force: true })
    .get('@search').its('value').should('eq', searchString)
  })

  it('should emit add spec', () => {
    mountWithResultCount(0)
    cy.findAllByLabelText(defaultMessages.specPage.newSpecButton)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })

  it('exposes the result count correctly to assistive tech', () => {
    mountWithResultCount(0)
    cy.contains(`0 ${ defaultMessages.specPage.matchPlural}`)
    .should('have.class', 'sr-only')
    .and('have.attr', 'aria-live', 'polite')

    mountWithResultCount(1)
    cy.contains(`1 ${ defaultMessages.specPage.matchSingular}`).should('have.class', 'sr-only')
    mountWithResultCount(100)
    cy.contains(`100 ${ defaultMessages.specPage.matchPlural}`).should('have.class', 'sr-only')
  })
})
