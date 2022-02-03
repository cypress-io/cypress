import { ref } from 'vue'
import Checkbox from './Checkbox.vue'

describe('<Checkbox />', () => {
  it('renders', () => {
    const value = ref(true)

    cy.mount(() => (<Checkbox
      label="Welcome guide settings"
      id="welcome-opt-out"
      modelValue={value.value}
    >
      <span class="text-gray-800 font-light">Show the welcome guide when opening Cypress.</span>
    </Checkbox>))
  })
})
