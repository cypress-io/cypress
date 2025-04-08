import FileMatchInput from './FileMatchInput.vue'
import { ref } from 'vue'

describe('<FileMatchInput />', () => {
  it('renders a reasonable length text and can be typed into', () => {
    const initialText = 'Initial Text Value'
    const newText = 'Hello'
    const inputText = ref(initialText)
    const onUpdateTextSpy = cy.spy().as('onUpdateTextSpy')
    const methods = {
      'onUpdate:modelValue': (newValue) => {
        inputText.value = newValue
        onUpdateTextSpy(newValue)
      },
    }

    cy.mount(() => (<div class="p-12">
      <FileMatchInput aria-label="search for file" modelValue={inputText.value} {...methods} />
    </div>))
    .get('input[type=search]').should('have.value', initialText)
    .clear().type(newText)
    .get('@onUpdateTextSpy').should('have.been.calledWith', newText)
    .invoke('getCalls').should('have.length.at.least', newText.length)
    .get('input[type=search]').should('have.value', newText)
    .clear()
    .get('@onUpdateTextSpy').should('have.been.calledWith', '')
    .get('input[type=search]').should('have.attr', 'autocomplete', 'off')
  })
})
