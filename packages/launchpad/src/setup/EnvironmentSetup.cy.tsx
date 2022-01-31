import { EnvironmentSetupFragmentDoc } from '../generated/graphql-test'
import EnvironmentSetup from './EnvironmentSetup.vue'
import { FRONTEND_FRAMEWORKS, CODE_LANGUAGES } from '../../../types/src/constants'

describe('<EnvironmentSetup />', () => {
  it('default component', { viewportWidth: 800 }, () => {
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

      if (frameworkName.includes('Vue')) {
        return 'vue-logo'
      }

      return `${Cypress._.lowerCase(frameworkName).replace(' ', '')}-logo`
    }

    FRONTEND_FRAMEWORKS.forEach((framework) => {
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
})
