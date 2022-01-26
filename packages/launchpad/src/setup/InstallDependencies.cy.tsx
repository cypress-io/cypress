import { defaultMessages } from '@cy/i18n'
import InstallDependencies from './InstallDependencies.vue'
import { InstallDependenciesFragmentDoc } from '../generated/graphql-test'
import { PACKAGES_DESCRIPTIONS } from '../../../types/src/constants'

describe('<InstallDependencies />', () => {
  beforeEach(function () {
    this.onBack = cy.stub()

    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => {
        return <InstallDependencies gql={gqlVal} backFn={this.onBack}/>
      },
    })
  })

  it('displays package information and links', () => {
    cy.contains('a', '@cypress/react')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/@cypress/react')

    cy.contains('a', '@cypress/webpack-dev-server')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/@cypress/webpack-dev-server')

    cy.contains(PACKAGES_DESCRIPTIONS['@cypress/react'].split('<span')[0])
    cy.contains(PACKAGES_DESCRIPTIONS['@cypress/webpack-dev-server'].split('<span')[0])

    cy.percySnapshot()
  })

  it('shows expected actions', () => {
    cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.install.confirmManualInstall).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
  })

  it('triggers back button callback', function () {
    cy.findByRole('button', {
      name: defaultMessages.setupPage.step.back,
    })
    .should('be.visible')
    .click()
    .then(() => {
      expect(this.onBack).to.have.been.calledOnce
    })
  })
})
