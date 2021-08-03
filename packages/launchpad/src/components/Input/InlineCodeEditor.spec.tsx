import HeartIcon from 'virtual:vite-icons/mdi/heart'
import InlineCodeEditor from './InlineCodeEditor.vue'
import Input from './Input.vue'

describe('InlineCodeEditor', () => {
  it('renders', () => {
    cy.mount(() => (
      <div>
        <Input
          class="font-mono"
          modelValue='Some value'
        />
        <InlineCodeEditor
          data-testid="code-editor"
          prefixIcon={HeartIcon}
          modelValue="console.log('I LOVE formatted code.')"
          // @ts-ignore
          onUpdateModelValue={cy.stub()}
        />
      </div>
    )).get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
  })
})
