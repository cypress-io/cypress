import { ref } from 'vue'
import Checkbox from './Checkbox.vue'

describe('<Checkbox />', () => {
  it('emits onUpdate:modalValue', () => {
    const reference = ref(true)
    const updateStub = cy.stub()

    cy.mount(<Checkbox label='Welcome guide settings' id="welcome-opt-out" modelValue={reference.value} onUpdate:modelValue={updateStub} />)

    cy.findByLabelText('Welcome guide settings').click().then(() => {
      expect(updateStub).to.have.been.calledWith(false)
    })

    cy.findByLabelText('Welcome guide settings').click().then(() => {
      expect(updateStub).to.have.been.calledWith(true)
    })
  })
})
