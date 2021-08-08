import { ref } from 'vue'
import Checkbox from './Checkbox.vue'

describe('<Checkbox />', () => {
  it('renders', () => {
    const value = true
    cy.mount(() => <Checkbox
      label="Welcome guide settings"
      description="The description"
      id="welcome-opt-out"
      modelValue={value}
      onUpdateModelValue={(newValue) => value.value = newValue}
    >
      <span class="text-gray-800 font-light">Show the welcome guide when openinig Cypress.</span>
      </Checkbox>)
  })
})
