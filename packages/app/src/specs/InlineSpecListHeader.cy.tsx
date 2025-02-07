import InlineSpecListHeader from './InlineSpecListHeader.vue'
import { ref } from 'vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'
import { defineStore } from 'pinia'

describe('InlineSpecListHeader', () => {
  const mountWithProps = (props: {resultCount?: number, isRunAllSpecsAllowed?: boolean} = {}) => {
    const specFilterModel = ref('')

    const propsWithDefaults = {
      resultCount: props.resultCount ?? 0,
      isRunAllSpecsAllowed: props.isRunAllSpecsAllowed ?? false,
      'onUpdate:specFilterModel': (val: string) => {
        specFilterModel.value = val
      },
      onNewSpec: cy.spy().as('new-spec'),
      onRunAllSpecs: cy.spy().as('run-all-specs'),
    }

    cy.wrap(specFilterModel).as('specFilterModel')

    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListHeader {...propsWithDefaults} specFilterModel={specFilterModel.value} />
      </div>))
  }

  it('should allow search', () => {
    mountWithProps({ resultCount: 0 })
    const searchString = 'my/component.cy.tsx'

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    // `force` necessary due to the field label being overlaid on top of the input
    .type(searchString, { delay: 0, force: true })
    .get('@specFilterModel').its('value').should('eq', searchString)
  })

  it('should emit add spec', () => {
    mountWithProps({ resultCount: 0 })
    cy.findAllByLabelText(defaultMessages.specPage.newSpecButton)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })

  it('clears search field when clear button is clicked', () => {
    mountWithProps({ resultCount: 0 })

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
    mountWithProps({ resultCount: 0 })
    cy.contains('No matches')
    .should('have.class', 'sr-only')
    .and('have.attr', 'aria-live', 'polite')

    mountWithProps({ resultCount: 1 })
    cy.contains('1 match').should('have.class', 'sr-only')
    mountWithProps({ resultCount: 100 })
    cy.contains('100 matches').should('have.class', 'sr-only')
  })

  it('renders "Run All Specs" button with flag and emits on click', () => {
    const EXPECTED_SPEC_COUNT = 2

    // make a small store to simulate some specs existing
    // without touching any of the gql used by the real store
    const useRunAllSpecsStore = defineStore('runAllSpecs', {
      state: () => ({ allSpecsRef: ref(Array(EXPECTED_SPEC_COUNT)) }),
    })

    useRunAllSpecsStore()

    mountWithProps({ isRunAllSpecsAllowed: true })

    cy.get('[data-cy=run-all-specs-for-all]').as('run-all-btn').realHover()
    cy.contains(`Run ${EXPECTED_SPEC_COUNT} specs`).should('be.visible')

    cy.percySnapshot('with tooltip')

    cy.get('@run-all-btn').click()
    cy.get('@run-all-specs').should('have.been.called')
  })
})
