import { defaultMessages } from '@cy/i18n'
import InstallDependencies from './InstallDependencies.vue'
import { InstallDependenciesFragmentDoc } from '../generated/graphql-test'
import { CYPRESS_REACT_LATEST, CYPRESS_WEBPACK } from '@packages/scaffold-config'

describe('<InstallDependencies />', () => {
  context('default props', () => {
    beforeEach(function () {
      cy.clock()
      this.onBack = cy.spy()

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

      cy.contains(CYPRESS_REACT_LATEST.description.split('<span')[0])
      cy.contains(CYPRESS_WEBPACK.description.split('<span')[0])

      cy.percySnapshot()
    })

    it('shows expected actions', () => {
      cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
      cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')

      cy.contains('button', defaultMessages.setupPage.install.checkForUpdates).should('not.exist')
      cy.contains('button', defaultMessages.setupPage.step.skip).should('be.visible')
    })

    it('shows expected actions after 180000ms', () => {
      cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
      cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
      cy.tick(180000)
      cy.contains('button', defaultMessages.setupPage.install.checkForUpdates).should('be.visible')
      cy.contains('button', defaultMessages.setupPage.step.skip).should('not.exist')
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

  context('modified props', () => {
    beforeEach(function () {
      this.onBack = cy.spy()

      cy.mountFragment(InstallDependenciesFragmentDoc, {
        render: (gqlVal) => {
          return <InstallDependencies gql={gqlVal} backFn={this.onBack} skip='Custom skip'/>
        },
      })
    })

    it('shows expected actions', () => {
      cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
      cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')
      cy.contains('button', 'Custom skip').should('be.visible')
    })
  })
})
