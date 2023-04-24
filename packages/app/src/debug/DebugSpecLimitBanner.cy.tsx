import DebugSpecLimitBanner from './DebugSpecLimitBanner.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugSpecLimitBanner />', () => {
  it('renders expected copy and link', () => {
    cy.mount(() => (
      <DebugSpecLimitBanner
        failedTestCount={120}
        cloudRunUrl="#"
      />
    ))

    cy.contains(defaultMessages.debugPage.limit.title)
    cy.contains(defaultMessages.debugPage.limit.message.split('|')[0].trim().replace('{n}', '120'))
    cy.contains(defaultMessages.debugPage.limit.link)

    cy.get('a').should('have.attr', 'href')
    .and('match', /utm_medium/)
    .and('match', /utm_campaign/)
    .and('match', /utm_source/)

    cy.viewport(1000, 400)
    cy.percySnapshot('large viewport')

    cy.viewport(600, 400)
    cy.percySnapshot('small viewport')
  })

  it('does not render link if no url provided', () => {
    cy.mount(() => (
      <DebugSpecLimitBanner
        failedTestCount={120}
        cloudRunUrl={null}
      />
    ))

    cy.get('a').should('not.exist')

    cy.percySnapshot()
  })
})
