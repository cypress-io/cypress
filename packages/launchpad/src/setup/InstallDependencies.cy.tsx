// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'
import InstallDependencies from './InstallDependencies.vue'
import { InstallDependenciesFragmentDoc } from '../generated/graphql-test'
import * as wizardDeps from '@packages/scaffold-config/src/dependencies'

describe('<InstallDependencies />', () => {
  beforeEach(function () {
    cy.clock()
  })

  it('displays package information and links', () => {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => {
        return <InstallDependencies gql={gqlVal} backFn={cy.spy()} />
      },
    })

    cy.contains('a', 'react')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/react')

    cy.contains('a', 'react-dom')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/react-dom')

    cy.contains('a', 'typescript')
    .should('be.visible')
    .and('have.attr', 'href', 'https://www.npmjs.com/package/typescript')

    cy.percySnapshot()
  })

  it('shows expected actions', () => {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => {
        return <InstallDependencies gql={gqlVal} backFn={cy.spy()} />
      },
    })

    cy.contains('button', defaultMessages.clipboard.copy).should('be.visible')
    cy.contains('button', defaultMessages.setupPage.step.back).should('be.visible')

    cy.contains('button', defaultMessages.setupPage.step.skip).should('be.visible')
  })

  it('triggers back button callback', function () {
    const onBack = cy.spy()

    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => {
        return <InstallDependencies gql={gqlVal} backFn={onBack} />
      },
    })

    cy.findByRole('button', {
      name: defaultMessages.setupPage.step.back,
    })
    .should('be.visible')
    .click()
    .then(() => {
      expect(onBack).to.have.been.calledOnce
    })
  })

  it('renders with all dependencies installed', function () {
    cy.mountFragment(InstallDependenciesFragmentDoc, {
      render: (gqlVal) => {
        gqlVal.wizard.installDependenciesCommand = null
        gqlVal.wizard.packagesToInstall = [
          {
            __typename: 'WizardNpmPackage',
            id: 'react',
            satisfied: true,
            detectedVersion: '18.3.1',
            ...wizardDeps.WIZARD_DEPENDENCY_REACT,
          },
          {
            __typename: 'WizardNpmPackage',
            id: 'react-dom',
            satisfied: true,
            detectedVersion: '18.3.1',
            ...wizardDeps.WIZARD_DEPENDENCY_REACT_DOM,
          },
          {
            __typename: 'WizardNpmPackage',
            id: 'typescript',
            satisfied: true,
            detectedVersion: '2.0.1',
            ...wizardDeps.WIZARD_DEPENDENCY_TYPESCRIPT,
          },
        ]

        return <InstallDependencies gql={gqlVal} backFn={cy.spy()} />
      },
    })

    cy.contains('You\'ve successfully installed all required dependencies.').should('be.visible')
    cy.percySnapshot('installation completed with banner')

    cy.findByLabelText('Dismiss').click()
    cy.contains('You\'ve successfully installed all required dependencies.').should('not.exist')
  })
})
