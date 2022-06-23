import SpecsListHeader from './SpecsListHeader.vue'
import { defineComponent, ref, h } from 'vue'
import { defaultMessages } from '@cy/i18n'

const buttonSelector = '[data-cy=new-spec-button]'

const mountWithSearchRef = () => {
  const search = ref('')

  cy.wrap(search).as('search')

  cy.mount(defineComponent({
    setup () {
      return () => h(SpecsListHeader, {
        modelValue: search.value,
        'onUpdate:modelValue': (val: string) => {
          search.value = val
        },
      })
    },
  }))
}

describe('<SpecsListHeader />', { keystrokeDelay: 0 }, () => {
  it('can be searched', () => {
    const searchString = 'my/component.cy.tsx'

    mountWithSearchRef()

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    .type(searchString, { delay: 0 })
    .get('@search').its('value').should('eq', searchString)
  })

  it('clears search field when clear button is clicked', () => {
    mountWithSearchRef()

    cy.findByTestId('clear-search-button')
    .should('not.exist')

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    .type('abcd', { delay: 0 })
    .get('@search').its('value').should('eq', 'abcd')

    cy.findByTestId('clear-search-button')
    .click()
    .get('@search').its('value').should('eq', '')
  })

  it('emits a new spec event', () => {
    const showCreateSpecModal = cy.spy().as('new-spec')
    const search = ref('')

    cy.mount(() => (<div class="max-w-800px p-12 resize overflow-auto"><SpecsListHeader
      modelValue={search.value}
      onShowCreateSpecModal={showCreateSpecModal}
      resultCount={0}
    /></div>))
    .get(buttonSelector)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })

  it('emits a spec pattern event', () => {
    const onShowSpecPatternModal = cy.stub().as('show-spec-pattern-modal')
    const search = ref('')

    cy.mount(() => (
      <div class="max-w-800px p-12 resize overflow-auto">
        <SpecsListHeader
          modelValue={search.value}
          onShowSpecPatternModal={onShowSpecPatternModal}
          resultCount={0}
        />
      </div>))

    cy.contains('button', defaultMessages.createSpec.viewSpecPatternButton)
    .click()
    .get('@show-spec-pattern-modal')
    .should('have.been.called')

    cy.percySnapshot()
  })

  it('shows the count correctly when not searching', () => {
    const mountWithSpecCount = (count = 0) => {
      cy.mount(() => (<div class="max-w-800px p-12 resize overflow-auto"><SpecsListHeader
        modelValue={''}
        specCount={count}
      /></div>))
    }

    mountWithSpecCount(0)
    cy.contains('No Matches')
    .should('be.visible')
    .and('have.attr', 'aria-live', 'polite')

    cy.percySnapshot('No Matches')

    mountWithSpecCount(1)
    cy.contains('1 Match').should('be.visible')

    cy.percySnapshot('Singular Match')

    mountWithSpecCount(100)
    cy.contains('100 Matches').should('be.visible')

    cy.percySnapshot('Plural Match')
  })

  it('shows the count correctly while searching', () => {
    const mountWithCounts = (resultCount = 0, specCount = 0) => {
      cy.mount(() => (<div class="max-w-800px p-12 resize overflow-auto"><SpecsListHeader
        modelValue={'foo'}
        resultCount={resultCount}
        specCount={specCount}
      /></div>))
    }

    mountWithCounts(0, 0)
    cy.contains('No Matches')

    mountWithCounts(0, 22)
    cy.contains('0 of 22 Matches')

    mountWithCounts(0, 1)
    cy.contains('0 of 1 Match').should('be.visible')

    mountWithCounts(1, 1)
    cy.contains('1 of 1 Match').should('be.visible')

    mountWithCounts(5, 22)
    cy.contains('5 of 22 Matches').should('be.visible')

    cy.percySnapshot()
  })
})
