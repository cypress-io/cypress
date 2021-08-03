import { ref } from 'vue'
import CodeEditor from './CodeEditor.vue'

describe('CodeEditor', () => {
  it('renders', () => {
    const myCode = ref('console.log("I LOVE formatted code.")')

    cy.mount(() => (
      <CodeEditor
        class="font-mono p-4"
        data-testid="code-editor"
        modelValue={myCode}
        onUpdateModelValue={cy.stub()}
      />
    )).get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
  })
})
