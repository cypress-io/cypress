import SpecsListHeader from './SpecsListHeader.vue'
import { ref } from 'vue'

describe('<SpecsListHeader />', () => {
  it('renders', () => {
    const search = ref('')
    const searchString = 'my/component.cy.tsx'
    const onNewSpec = cy.spy().as('New Spec')

    cy.mount(<SpecsListHeader
      vModel={search.value}
      modelValue={search.value}
      onNewSpec={onNewSpec}
      onInput={(e) => {
        search.value = e.target.value
      }}
    />)
    .get('input').type(searchString)
    // .get('button').click()
    .should(() => {
      expect(search.value).to.equal(searchString)
      // expect(onNewSpec).to.have.been.called
    })
  })
})
