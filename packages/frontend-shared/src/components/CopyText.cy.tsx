import CopyText from './CopyText.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<CopyText />', () => {
  it('renders without overflow', { viewportWidth: 800, viewportHeight: 120 }, () => {
    cy.mount(() => (
      <div class="p-6">
        <CopyText text="https://www.test.test"/>
      </div>
    ))

    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
  })

  it('overflows nicely', { viewportWidth: 800, viewportHeight: 120 }, () => {
    const text = 'yarn workspace @packages/frontend-shared cypress:run --record --key 123as4d56asda987das'

    cy.mount(() => (
      <div class="p-6">
        <CopyText text={text}/>
      </div>
    ))

    cy.contains(text)
    cy.contains('button', defaultMessages.clipboard.copy)
    .should('be.visible')
    .percySnapshot()
  })
})
