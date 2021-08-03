import CodeEditor from './CodeEditor.vue'

describe('CodeEditor', () => {
  it('renders', () => {
    cy.mount(() => (
      <CodeEditor
        class="font-mono p-4"
        data-testid="code-editor"
        modelValue="console.log('I LOVE formatted code.')"
      />
    )).get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
  })
})
