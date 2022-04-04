import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'
import { CODE_LANGUAGES } from '@packages/types/src/constants'
import { WIZARD_FRAMEWORKS } from '@packages/scaffold-config'

describe('<EnvironmentSetup />', { viewportWidth: 800 }, () => {
  it('default component', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByRole('button', {
      name: 'Front-end Framework Pick a framework',
      expanded: false,
    })
    .should('have.attr', 'aria-haspopup', 'true')
    .click()
    .should('have.attr', 'aria-expanded', 'true')

    const frameworkIconName = (frameworkName) => {
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

    WIZARD_FRAMEWORKS.forEach((framework) => {
      cy.findByRole('option', { name: framework.name })
      .find('svg')
      .should('have.attr', 'data-cy', frameworkIconName(framework.name))
    })

    CODE_LANGUAGES.forEach((lang) => {
      cy.findByRole('button', { name: lang.name })
    })

    cy.findByRole('button', { name: 'Next Step' })
    .should('have.disabled')
  })

  it('renders the detected flag', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.frameworks[0].isDetected = true
      },
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByRole('button', {
      name: 'Front-end Framework Pick a framework',
      expanded: false,
    }).click()

    cy.findByRole('option', { name: 'Create React App (v4) (detected)' }).should('be.visible')
  })

  it('shows the description of bundler as Dev Server', () => {
    cy.mountFragment(EnvironmentSetupFragmentDoc, {
      onResult: (res) => {
        res.framework = {
          ...res.frameworks[3],
          supportedBundlers: res.allBundlers,
        }
      },
      render: (gqlVal) => (
        <div class="m-10">
          <EnvironmentSetup
            gql={gqlVal}
            nextFn={cy.stub()}
          />
        </div>
      ),
    })

    cy.findByLabelText('Bundler(Dev Server)').should('be.visible')
  })
})
