import { ref } from 'vue'
import Switch from './Switch.vue'

describe('<Switch />', () => {
  it('playground', { viewportWidth: 80, viewportHeight: 60 }, () => {
    const valueRef = ref(false)

    cy.mount(() => (
      <div class="p-6">
        <label id="test-switch">Switch</label>
        <Switch
          value={valueRef.value}
          onUpdate={(newVal) => (valueRef.value = newVal)}
          labelId="test-switch"
        />
      </div>
    ))

    cy.get('button')
    .click()
    .then(() => {
      expect(valueRef.value).to.be.true
    })
  })
})
