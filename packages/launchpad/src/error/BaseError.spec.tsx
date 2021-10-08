import { defaultMessages } from '@cy/i18n'
import BaseError from './BaseError.vue'
import Button from '@cy/components/Button.vue'

// Selectors
const headerSelector = '[data-testid=error-header]'
const messageSelector = '[data-testid=error-message]'
const retryButtonSelector = '[data-testid=error-retry-button]'
const docsButtonSelector = '[data-testid=error-read-the-docs-button]'
const docsLinkSelector = '[data-testid=error-docs-link]'
const customFooterSelector = '[data-testid=custom-error-footer]'

// Constants
const docsLink = 'https://docs.cypress.io'
const messages = defaultMessages.launchpadErrors.generic
const customHeaderMessage = "Well, this was unexpected!"
const customMessage = `Don't worry, just click the "It's fixed now" button to try again.`
const customFooterText = `Yikes, try again!`

describe('<BaseError />', () => {
  it('renders the default error the correct messages', () => {
    cy.mount(BaseError)
      .get(headerSelector)
      .should('contain.text', messages.header)
      .get(messageSelector)
      .should('contain.text', messages.message.replace('{0}', 'cypress.config.js'))
      .get(retryButtonSelector)
      .should('contain.text', messages.retryButton)
      .get(docsButtonSelector)
      .should('contain.text', messages.readTheDocsButton)
      .get(docsLinkSelector)
      .should('have.attr', 'href', docsLink)
      .and('have.attr', 'target', '_blank')
  })

  it('emits the retry event by default', () => {
    const retrySpy = cy.spy().as('retry')
    cy.mount(() => (<BaseError onRetry={retrySpy}/>))
      .get(retryButtonSelector)
      .click()
      .click()
      .get('@retry')
      .should('have.been.calledTwice')
  })

  it('renders custom error messages and headers with props', () => {

    cy.mount(<BaseError header={customHeaderMessage} message={customMessage}></BaseError>)
      .get('body')
      .should('contain.text', customHeaderMessage)
      .and('contain.text', customMessage)
  })

  it('renders the header, message, and footer slots', () => {
    const buttonSpy = cy.spy().as('buttonSpy')
    cy.mount(<BaseError v-slots={{
      footer: () => <Button onClick={buttonSpy} size="lg" data-testid="custom-error-footer">{ customFooterText }</Button>,
      header: () => <>{customHeaderMessage}</>,
      message: () => <>{customMessage}</>
    }}></BaseError>)
      .get('body')
      .should('contain.text', customHeaderMessage)
      .and('contain.text', customMessage)
      .get(customFooterSelector)
      .should('contain.text', customFooterText)
      .click()
      .get('@buttonSpy')
      .should('have.been.called')
  })
})
