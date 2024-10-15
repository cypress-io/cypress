// Anything with onClick SHOULD work, but isn't...
// Defining emits for "Button.vue" removes the native handler on the
// <button> element. vue-tsc just can't handle this yet.
import FileMatchButton from './FileMatchButton.vue'
import { faker } from '@faker-js/faker'
import { ref } from 'vue'
const fileMatchButtonSelector = '[data-cy=file-match-button]'

faker.seed(1)

describe('<FileMatchButton />', () => {
  it('renders a small extension', () => {
    cy.mount(() => (<div class="p-12">
      <FileMatchButton>
        *.jsx
      </FileMatchButton>
    </div>))
  })

  it('renders a long bit of text', () => {
    cy.mount(() => (<div class="p-12">
      <FileMatchButton>
        { faker.lorem.paragraph(1) }
      </FileMatchButton>
    </div>))
  })

  it('takes in an optional expanded prop', () => {
    const expanded = ref(false)

    cy.mount(() => (<div class="p-12">
      <FileMatchButton
        // @ts-ignore - vue @click isn't represented in JSX
        onClick={() => {
          expanded.value = !expanded.value
        }}
        expanded={expanded.value}
      >
        *.stories.*
      </FileMatchButton>
    </div>))
    .get(fileMatchButtonSelector)
    .click()
    .should('be.focused')
  })
})
