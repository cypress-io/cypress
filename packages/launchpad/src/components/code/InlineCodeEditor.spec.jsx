import HeartIcon from 'virtual:vite-icons/mdi/heart'
import InlineCodeEditor from './InlineCodeEditor.vue'
import InputOld from '../input/InputOld.vue'
import { ref } from 'vue'

describe('InlineCodeEditor', () => {
  it('renders', () => {
    const value = ref('console.log("hello world")')

    cy.mount(() => (
      <div>
        <InputOld
          class="font-mono"
          modelValue='Some value'
        />
        <InlineCodeEditor
          data-testid="code-editor"
          prefixIcon={HeartIcon}
          vModel={value.value}
        />
      </div>
    ))
    .get('[data-testid=code-editor] textarea').clear().type(`const four = 2 + 2;`, { delay: 0 })
  })
})
