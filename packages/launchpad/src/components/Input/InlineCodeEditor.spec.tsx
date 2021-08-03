import { ref } from 'vue'
import HeartIcon from 'virtual:vite-icons/mdi/heart'
import InlineCodeEditor from './InlineCodeEditor.vue'
import Input from './Input.vue'

describe('InlineCodeEditor', () => {
  // seems we have a problem with defineEmits
  it('renders', () => {
    const myCode = ref('console.log("I LOVE formatted code.")')

    cy.mount(() => (
      <div>
        <Input class="font-mono" modelValue={myCode.value} />
        <InlineCodeEditor
          data-testid="code-editor"
          prefixIcon={HeartIcon}
          modelValue={myCode}
          onUpdateModelValue={cy.stub()}
        />
      </div>
    )).get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
  })
})
