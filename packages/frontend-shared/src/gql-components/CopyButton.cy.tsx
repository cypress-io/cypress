import CopyButton from './CopyButton.vue'
import { Clipboard_CopyToClipboardDocument } from '../generated/graphql'

describe('<CopyButton />', { viewportHeight: 80, viewportWidth: 120 }, () => {
  it('copies text to clipboard', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" />
    </>))
    .get('button')
    .should('contain.text', 'Copy')
    .get('svg')
    .should('exist')

    const copyStub = cy.stub()

    cy.stubMutationResolver(Clipboard_CopyToClipboardDocument, (defineResult, { text }) => {
      copyStub(text)

      return defineResult({
        copyTextToClipboard: true,
      })
    })

    cy.findByRole('button', { name: 'Copy' }).click()
    cy.findByRole('button', { name: 'Copied!' }).should('be.visible')

    cy.wrap(copyStub).should('have.been.calledWith', 'Foobar')
  })

  it('noIcon hides the icon', () => {
    cy.mount(() => (<>
      <CopyButton text="Foobar" noIcon={true} />
    </>))
    .get('svg')
    .should('not.exist')
  })
})
