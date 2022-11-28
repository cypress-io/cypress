import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'

describe('<EnvironmentSetup />', { viewportWidth: 800 }, () => {
  it('default component', () => {
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
      name: 'Front-end framework Pick a framework',
      expanded: false,
    })
    .should('have.attr', 'aria-haspopup', 'true')
    .click()
    .should('have.attr', 'aria-expanded', 'true')

    cy.get('li')
    .then(($items) => {
      return $items.map((_idx, html) => Cypress.$(html).text()).get()
    })
    // alphabetical order
    // we should "support is in alpha" for a11y (not shown visually)
    .should('deep.eq', ['Create React App (v5) Support is in  Alpha', 'Vue.js (v3)'])

    const frameworkIconName = (frameworkName: string) => {
      if (frameworkName.includes('React')) {
        return 'react-logo'
      }

      if (frameworkName.includes('Nuxt')) {
        return 'nuxtjs-logo'
      }

      if (frameworkName.includes('Vue')) {
        return 'vue-logo'
      }

      return `${Cypress._.lowerCase(frameworkName).replace(' ', '')}-logo`
    }

    ;['Create React App (v5) Support is in Alpha', 'Vue.js (v3)'].forEach((name) => {
      cy.findByRole('option', { name })
      .find('svg')
      .should('have.attr', 'data-cy', frameworkIconName(name))
    })

    cy.findByRole('button', { name: 'Next step' })
    .should('have.disabled')
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
      name: 'Front-end framework Pick a framework',
      expanded: false,
    }).click()

    cy.findByRole('option', { name: 'Create React App (v5) Support is in Alpha (detected)' }).should('be.visible').click()
  })

  it('shows the description of bundler as Dev Server', () => {
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

    cy.findByLabelText('Bundler(dev server)').should('be.visible')
  })
})
