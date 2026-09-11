import DeprecatedRibbon from './DeprecatedRibbon.vue'
import { defaultMessages } from '../locales/i18n'

describe('<DeprecatedRibbon />', () => {
  it('renders the default deprecated label', { viewportWidth: 200, viewportHeight: 200 }, () => {
    cy.mount(() => (
      <div class="relative w-[160px] h-[160px] overflow-hidden border">
        <DeprecatedRibbon />
      </div>
    ))

    cy.findByTestId('deprecated-ribbon')
    .should('be.visible')
    .and('contain', defaultMessages.openBrowser.deprecatedRibbon)

    cy.percySnapshot()
  })

  it('renders a custom label via the default slot', { viewportWidth: 200, viewportHeight: 200 }, () => {
    cy.mount(() => (
      <div class="relative w-[160px] h-[160px] overflow-hidden border">
        <DeprecatedRibbon>Removed</DeprecatedRibbon>
      </div>
    ))

    cy.findByTestId('deprecated-ribbon').should('contain', 'Removed')
  })
})
