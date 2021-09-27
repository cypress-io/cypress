import SpecsListHeader from './SpecsListHeader.vue'
import { ref } from 'vue'
describe('<SpecsListHeader />', () => {
  it('renders', () => {
    const search = ref('')
    cy.mount(<SpecsListHeader
      vModel={search.value}
      modelValue={search.value}
      onInput={(e) => {
        console.log('on change', e);
        search.value = e.target.value
      }}
    />).get('input').type('hello world')
    .should(() => {
      console.log('search.value', search.value)
      // expect(search.value).to.equal('hello world')
    })
  })
})
