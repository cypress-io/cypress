import Input from './Input.vue'
import { ref } from 'vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import CoffeeIcon from '~icons/mdi/coffee'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these module imports
import LoadingIcon from '~icons/mdi/loading'

describe('<Input/>', { viewportWidth: 400, viewportHeight: 80 }, () => {
  it('binds to v-model', () => {
    const value = ref('')
    const textToType = 'My wonderful input text'

    // @ts-ignore = vModel is v-model in vue
    cy.mount(() => <Input vModel={value.value} aria-label="status"/>)
    cy.get('input').type(textToType, { delay: 0 })

    cy.should(() => {
      expect(value.value).to.equal(textToType)
    })

    cy.percySnapshot('without icons')
  })

  it('renders icons', () => {
    const value = ref('Coffee Loading')

    cy.mount(() => (
      <Input
        // @ts-ignore = vModel is v-model in vue
        vModel={value.value}
        prefixIcon={CoffeeIcon}
        suffixIcon={LoadingIcon}
        aria-label="status"
      />
    ))

    cy.findAllByLabelText('status').should('have.value', 'Coffee Loading')
    cy.percySnapshot('with icons')
  })

  it('ensures autocomplete is disabled', () => {
    const value = ref('')

    // @ts-ignore = vModel is v-model in vue
    cy.mount(() => <Input vModel={value.value} aria-label="status"/>)
    cy.get('input').should('have.attr', 'autocomplete', 'off')
  })
})
