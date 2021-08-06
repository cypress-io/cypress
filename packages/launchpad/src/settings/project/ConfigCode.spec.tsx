import ConfigCode from './ConfigCode.vue'
import jsonObject from '../../../cypress.json'
import { defaultMessages } from '../../locales/i18n'

const selector = '[data-testid=code]'
const jsonString = JSON.stringify(jsonObject, null, 2)

describe('<ConfigCode />', () => {
  beforeEach(() => {
    cy.mount(() => (<div class="p-12 max-w-full resize-x overflow-auto">
      {
        /* These classes and the tabindex are here to make this element focusable
         * for testing the double click event.
         * Arguably, we shouldn't need to use the `tabindex` prop
         * but that would require making the Copy behavior accesible.
         */
      }
      <ConfigCode data-testid="code" tab-index={0} class="focus:ring-0 focus:outline-none" code={jsonString} />
    </div>))
  })

  it('renders the code passed in', () => {
    cy.get(selector).should('contain.text', jsonString)
  })

  it('can be double clicked to copy the code', () => {
    cy.findByText(defaultMessages.clipboard.copied).should('not.be.visible').get(selector).dblclick()
    cy.findByText(defaultMessages.clipboard.copied).should('be.visible')
    cy.findByText(defaultMessages.clipboard.copied).should('not.be.visible')
  })

  it('has an edit button', () => {
    cy.findByText(defaultMessages.file.edit).should('be.visible').click()
  })
})
