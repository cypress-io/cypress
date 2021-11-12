import InlineSpecListHeader from './InlineSpecListHeader.vue'
import { ref } from 'vue'

describe('InlineSpecListHeader', () => {
  beforeEach(() => {
    const search = ref('')
    const tab = ref('file-list')
    const onAddSpec = cy.spy().as('new-spec')

    cy.wrap(search).as('search')
    cy.wrap(tab).as('tab')

    const methods = {
      search: search.value,
      'onUpdate:search': (val: string) => {
        search.value = val
      },
      tab: tab.value,
      'onUpdate:tab': (val: string) => {
        tab.value = val
      },
      onAddSpec,
    }

    cy.mount(() =>
      (<div class="bg-gray-1000">
        <InlineSpecListHeader {...methods} />
      </div>))
  })

  it('should allow search', () => {
    const searchString = 'my/component.cy.tsx'

    cy.get('input')
    .type(searchString, { delay: 0 })
    .get('@search').its('value').should('eq', searchString)
  })

  it('should toggle radio group', () => {
    cy.get('[data-cy="file-tree-radio-option"]')
    .click()
    .get('@tab').its('value').should('eq', 'file-tree')
  })

  it('should emit add spec', () => {
    cy.get('[data-cy="runner-spec-list-add-spec"]').click()
    .get('@new-spec')
    .should('have.been.called')
  })
})
