import ConfigCode from './ConfigCode.vue'
import jsonObject from '../../../cypress.json'
import { defaultMessages } from '../../locales/i18n'

const selector = '[data-testid=code]'
const jsonString = JSON.stringify(jsonObject, null, 2)

describe('<ConfigCode />', () => {
  beforeEach(() => {
    cy.mount(() => (<div class="p-12 overflow-auto">
      {
        /* These classes and the tabindex are here to make this element focusable
         * for testing the double click event.
         * Arguably, we shouldn't need to use the `tabindex` prop
         * but that would require making the Copy behavior accesible.
         */
      }
      { /* @ts-ignore */ }
      <ConfigCode data-testid="code" tabindex={0} class="" code={jsonString} />
    </div>))
  })

  it('renders the code passed in', () => {
    cy.get(selector).should('contain.text', jsonString)
  })

  // This needs to be skipped because it cannot be tested unless "Emulate a focused page" is checked.
  // TODO: This fails on CI due to permissions. Find way to handle CI,
  // eg provide mock copy method or something like that.
  it.skip('can be double clicked to copy the code', () => {
    cy.findByText(defaultMessages.clipboard.copied).should('not.be.visible').get(selector)
    .focus().dblclick()

    cy.findByText(defaultMessages.clipboard.copied).should('be.visible')
    cy.findByText(defaultMessages.clipboard.copied).should('not.be.visible')
  })

  it('has an edit button', () => {
    cy.findByText(defaultMessages.file.edit).should('be.visible').click()
  })
})
