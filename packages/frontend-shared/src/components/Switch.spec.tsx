import { ref } from 'vue'
import Switch from './Switch.vue'

describe('<Switch />', () => {
  it('playground', { viewportWidth: 80, viewportHeight: 60 }, () => {
    const valueRef = ref(false)

    cy.mount(() => (
      <div class="p-6">
        <label for="test-switch">Switch</label>
        <Switch
          // @ts-ignore
          value={valueRef.value}
          // @ts-ignore
          onUpdate={(newVal) => (valueRef.value = newVal)}
          name="test-switch"
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
