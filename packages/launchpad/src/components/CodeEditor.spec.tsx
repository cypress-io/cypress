import { get } from 'lodash'
import { ref } from 'vue'
import CodeEditor from './CodeEditor.vue'
import Input from './Input.vue'

it('renders', () => {
  const myCode = ref('console.log("I LOVE formatted code.")')

  cy.mount(() => (<div><Input class="font-mono" modelValue={ myCode.value }></Input><CodeEditor
    class="w-full h-full rounded border-transparent disabled:bg-cool-gray-100 disabled:text-cool-gray-400 border-cool-gray-300 focus:border-gray-500 focus:bg-white bg-gray-100 focus:ring-0 focus:outline-none focus:bg-white focus:text-gray-900 border-1 px-2 py-0 indent-4px font-mono" 
    data-testid="code-editor"
    modelValue={ myCode }
  onUpdate:modelValue={ (val) => {
      myCode.value = val
    } } /></div>))
    .get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
})


