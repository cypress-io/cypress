import SpecsListHeader from './SpecsListHeader.vue'
import { ref } from 'vue'

const buttonSelector = '[data-testid=new-spec-button]'
const inputSelector = 'input[type=search]'

describe('<SpecsListHeader />', { keystrokeDelay: 0 }, () => {
  it('can be searched', () => {
    const search = ref('')
    const searchString = 'my/component.cy.tsx'

    cy.mount(<SpecsListHeader modelValue={search.value} />)
    .get(inputSelector)
    .type(searchString, { delay: 0 })
    .should(() => {
      expect(search.value).to.equal(searchString)
    })
  })

  it('emits a new spec event', () => {
    const onNewSpec = cy.spy().as('new-spec')
    const search = ref('')

    cy.mount(<SpecsListHeader
      modelValue={search.value}
      onNewSpec={onNewSpec}
    />)
    .get(buttonSelector)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })
})
