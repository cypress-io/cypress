import { ref } from 'vue'
import HeartIcon from 'virtual:vite-icons/mdi/heart'
import InlineCodeEditor from './InlineCodeEditor.vue'
import Input from './Input.vue'

it('renders', () => {
  const myCode = ref('console.log("I LOVE formatted code.")')

  cy.mount(() => (<div><Input class="font-mono" modelValue={ myCode.value }></Input><InlineCodeEditor
    data-testid="code-editor"
    prefixIcon={ HeartIcon }
    modelValue={ myCode }
  onUpdate:modelValue={ (val) => {
      myCode.value = val
    } } /></div>))
    .get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
})


