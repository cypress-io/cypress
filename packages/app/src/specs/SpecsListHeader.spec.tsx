import SpecsListHeader from './SpecsListHeader.vue'
import { defineComponent, ref, h } from 'vue'

const buttonSelector = '[data-testid=new-spec-button]'
const inputSelector = 'input[type=search]'

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
    .get(inputSelector)
    .type(searchString, { delay: 0 })
    .then(() => {
      expect(search.value).to.equal(searchString)
    })
  })

  it('emits a new spec event', () => {
    const onNewSpec = cy.spy().as('new-spec')
    const search = ref('')

    cy.mount(<div class="max-w-800px p-12 resize overflow-auto"><SpecsListHeader
      modelValue={search.value}
      onNewSpec={onNewSpec}
    /></div>)
    .get(buttonSelector)
    .click()
    .get('@new-spec')
    .should('have.been.called')
  })
})
