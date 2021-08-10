import Input from './Input.vue'
import { ref } from 'vue'

describe('<Input/>', () => {
  it('binds to v-model', () => {
    const value = ref('')
    const textToType = 'My wonderful input text'

    cy.mount(() => <Input vModel={value.value}/>)
    cy.get('input').type(textToType, { delay: 0 })

    cy.should(() => {
      expect(value.value).to.equal(textToType)
    })
  })
})
