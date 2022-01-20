import { MigrationWizardDataFragmentDoc } from '../generated/graphql-test'
import MigrationWizard from './MigrationWizard.vue'

describe('<MigrationWizard/>', { viewportWidth: 1280, viewportHeight: 1100 }, () => {
  it('renders Automatic rename', () => {
    cy.mountFragment(MigrationWizardDataFragmentDoc, {
      onResult (res) {
        res.migration = {
          __typename: 'Migration',
          step: 'renameAuto',
          specFilesAfter: ['test.cy.tsx'],
          specFilesBefore: ['test.spec.tsx'],
          manualFiles: ['test.cy.tsx'],
          configAfterCode: '{}',
          configBeforeCode: '{}',
        }
      },
      render () {
        return (<div class="p-16px">
          <MigrationWizard />
        </div>)
      },
    })
  })

  it('renders Manual rename', () => {
    cy.mountFragment(MigrationWizardDataFragmentDoc, {
      onResult (res) {
        res.migration = {
          __typename: 'Migration',
          step: 'renameManual',
          specFilesAfter: ['test.cy.tsx'],
          specFilesBefore: ['test.spec.tsx'],
          manualFiles: ['test.cy.tsx'],
          configAfterCode: '{}',
          configBeforeCode: '{}',
        }
      },
      render () {
        return (<div class="p-16px">
          <MigrationWizard />
        </div>)
      },
    })
  })

  it('renders Config File migration', () => {
    cy.mountFragment(MigrationWizardDataFragmentDoc, {
      onResult (res) {
        res.migration = {
          ...res.migration,
          __typename: 'Migration',
          step: 'configFile',
          specFilesAfter: ['test.cy.tsx'],
          specFilesBefore: ['test.spec.tsx'],
          manualFiles: ['test.cy.tsx'],
          configAfterCode: '{}',
          configBeforeCode: '{}',
        }
      },
      render () {
        return (<div class="p-16px">
          <MigrationWizard />
        </div>)
      },
    })
  })
})
