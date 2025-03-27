import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', { viewportWidth: 800 }, () => {
  it('displays framework options and links to community defined frameworks', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      render: (gqlVal) => (
        <div class='m-10'>
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByRole('button', {
      name: 'Pick a framework',
      expanded: false,
    })
    .should('have.attr', 'aria-haspopup', 'true')
    .click()
    .should('have.attr', 'aria-expanded', 'true')

    cy.get('li').spread(($firstLi, $secondLi) => {
      cy.wrap($firstLi).should('contain', 'React.js')
      cy.wrap($firstLi).find('svg').should('have.attr', 'data-cy', 'react-logo')

      cy.wrap($secondLi).should('contain', 'Vue.js (v3)')
      cy.wrap($secondLi).find('svg').should('have.attr', 'data-cy', 'vue-logo')
    })

    cy.findByRole('button', { name: 'Next step' })
    .should('be.disabled')

    cy.findByRole('link', { name: 'Browse our list of third-party framework integrations' })
    .should('have.attr', 'href', 'https://on.cypress.io/component-integrations?utm_medium=Select+Framework+Dropdown&utm_source=Binary%3A+Launchpad&utm_campaign=Browse+third-party+frameworks')

    cy.percySnapshot()
  })

  it('renders the detected flag', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.frameworks[0].isDetected = true
      },
      render: (gqlVal) => (
        <div class='m-10'>
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByRole('button', {
      name: 'Pick a framework',
      expanded: false,
    }).click()

    cy.findByRole('option', { name: 'React.js (detected)' }).should('be.visible').click()
  })

  it('shows the description of bundler', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.framework = {
          ...res.frameworks[1],
          supportedBundlers: res.allBundlers,
        }
      },
      render: (gqlVal) => (
        <div class='m-10'>
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByLabelText('Pick a bundler').should('be.visible')
  })

  it('shows errored community frameworks', () => {
    const PATH_1 = '/quite-long/path/to/node_modules/for/definition1/package.json'
    const PATH_2 = '/quite-long/path/to/node_modules/for/definition2/package.json'
    const PATH_3 = '/quite-long/path/to/node_modules/for/definition3/package.json'
    const PLURAL_MESSAGE = 'This project has some community framework definitions installed that could not be loaded. They are located at the following paths:'
    const SINGULAR_MESSAGE = 'This project has a community framework definition installed that could not be loaded. It is located at the following path:'
    const DOCS_CTA = 'See the framework definition documentation for more information about creating, installing, and troubleshooting third party definitions.'

    // we will mount with multiple errored frameworks, and then with a single errored framework

    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.erroredFrameworks = [
          {
            id: '1',
            path: PATH_1,
            __typename: 'WizardErroredFramework',
          },
          {
            id: '2',
            path: PATH_2,
            __typename: 'WizardErroredFramework',
          },
          {
            id: '3',
            path: PATH_3,
            __typename: 'WizardErroredFramework',
          },
        ]
      },
      render: (gqlVal) => (
        <div class='m-10'>
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.contains('h2', 'Community framework definition problem')
    cy.contains('p', PLURAL_MESSAGE).should('be.visible')
    cy.contains('p', SINGULAR_MESSAGE).should('not.exist')
    cy.contains('li', PATH_1).should('be.visible')
    cy.contains('li', PATH_2).should('be.visible')
    cy.contains('li', PATH_3).should('be.visible')
    cy.contains('p', DOCS_CTA).should('be.visible')
    cy.contains('a', 'framework definition documentation').should('have.attr', 'href', 'https://on.cypress.io/component-integrations?utm_medium=Framework+Definition+Warning&utm_source=Binary%3A+Launchpad')

    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.erroredFrameworks = [
          {
            id: '1',
            path: PATH_1,
            __typename: 'WizardErroredFramework',
          },
        ]
      },
      render: (gqlVal) => (
        <div class='m-10'>
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.contains('p', PLURAL_MESSAGE).should('not.exist')
    cy.contains('p', SINGULAR_MESSAGE).should('be.visible')

    cy.get('li')
    .should('have.length', 1)
    .contains(PATH_1)
    .should('be.visible')
  })
})
