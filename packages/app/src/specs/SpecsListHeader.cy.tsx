import SpecsListHeader from './SpecsListHeader.vue'
import { defineComponent, ref, h } from 'vue'
import { defaultMessages } from '@cy/i18n'

const buttonSelector = '[data-cy=new-spec-button]'

describe('<SpecsListHeader />', { keystrokeDelay: 0 }, () => {
  it('can be searched', () => {
    const search = ref('')
    const searchString = 'my/component.cy.tsx'

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

    cy.findByLabelText(defaultMessages.specPage.searchPlaceholder)
    .type(searchString, { delay: 0 })
    .then(() => {
      expect(search.value).to.equal(searchString)
    })
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
  })

  it('shows the result count correctly', () => {
    const mountWithResultCount = (count = 0) => {
      cy.mount(() => (<div class="max-w-800px p-12 resize overflow-auto"><SpecsListHeader
        modelValue={''}
        resultCount={count}
      /></div>))
    }

    mountWithResultCount(0)
    cy.contains(`0 ${ defaultMessages.specPage.matchPlural}`)
    .should('be.visible')
    .and('have.attr', 'aria-live', 'polite')

    mountWithResultCount(1)
    cy.contains(`1 ${ defaultMessages.specPage.matchSingular}`).should('be.visible')
    mountWithResultCount(100)
    cy.contains(`100 ${ defaultMessages.specPage.matchPlural}`).should('be.visible')
  })
})
