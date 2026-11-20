import { ExperimentsFragmentDoc } from '../../generated/graphql-test'
import config from '@packages/frontend-shared/cypress/fixtures/config.json'
import Experiments from './Experiments.vue'

const experimentNames: Record<string, string> = {
  experimentalCspAllowList: 'CSP Allow List',
  experimentalInteractiveRunEvents: 'Interactive run events',
  experimentalWebKitSupport: 'WebKit Support',
}

describe('<Experiments />', { viewportWidth: 800, viewportHeight: 600 }, () => {
  const experimentEntries = config.filter((a) => a.field.startsWith('experimental'))

  it('renders experiments that are passed in', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      render (gql) {
        return (<div class="py-4 px-8">
          <Experiments gql={gql} />
        </div>)
      },
    })

    experimentEntries.forEach((exp) => {
      const expName = experimentNames[exp.field]

      cy.contains(`[data-cy="experiment-${exp.field}"]`, expName)
      .should('contain', exp.value ? 'Enabled' : 'Disabled')
    })
  })

  it('renders the experimental retries options from the retries config', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      onResult (result) {
        const retries = result.config.find((item) => item.field === 'retries')

        retries.value = { ...retries.value, experimentalStrategy: 'detect-flake-and-pass-on-threshold' }
      },
      render (gql) {
        return <Experiments gql={gql} />
      },
    })

    cy.contains('[data-cy="experiment-retries.experimentalStrategy"]', 'Retries Strategy')
    .should('contain', 'Enabled')

    cy.contains('[data-cy="experiment-retries.experimentalOptions"]', 'Retries Strategy Options')
    .should('contain', 'Disabled')
  })

  it('renders the other experiments when the config has no retries entry', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      onResult (result) {
        result.config = result.config.filter((item) => item.field !== 'retries')
      },
      render (gql) {
        return <Experiments gql={gql} />
      },
    })

    experimentEntries.forEach((exp) => {
      cy.get(`[data-cy="experiment-${exp.field}"]`).should('be.visible')
    })

    cy.get('[data-cy^="experiment-retries."]').should('not.exist')
  })

  it('renders the experimental retries options as disabled when retries is null', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      onResult (result) {
        result.config.find((item) => item.field === 'retries').value = null
      },
      render (gql) {
        return <Experiments gql={gql} />
      },
    })

    cy.get('[data-cy="experiment-retries.experimentalStrategy"]').should('contain', 'Disabled')
    cy.get('[data-cy="experiment-retries.experimentalOptions"]').should('contain', 'Disabled')
  })

  it('renders no experiments when the project has no config', () => {
    cy.mountFragment(ExperimentsFragmentDoc, {
      onResult (result) {
        result.config = null
      },
      render (gql) {
        return <Experiments gql={gql} />
      },
    })

    cy.get('[data-cy="settings-experiments"]').should('be.visible')
    cy.get('[data-cy^="experiment-"]').should('not.exist')
  })

  it('renders no experiments without project data', () => {
    cy.mount(<Experiments gql={null} />)

    cy.get('[data-cy="settings-experiments"]').should('be.visible')
    cy.get('[data-cy^="experiment-"]').should('not.exist')
  })
})
