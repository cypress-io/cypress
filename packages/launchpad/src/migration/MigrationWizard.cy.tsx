import { MigrationWizardDataFragmentDoc } from '../generated/graphql-test'
import MigrationWizard from './MigrationWizard.vue'
import { defaultMessages } from '@cy/i18n'
import dedent from 'dedent'

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

    cy.findByText(defaultMessages.migration.wizard.step1.button).should('be.visible')
  })

  it('renders Automatic rename with skip', () => {
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

    cy.findByText(defaultMessages.migration.renameAuto.changeButton).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step1.buttonProceed).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.option2).click()
    cy.findByText(defaultMessages.migration.renameAuto.modals.step2.buttonSave).click()
    cy.findByText(defaultMessages.migration.wizard.step1.buttonSkip).should('be.visible')
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
          configBeforeCode: dedent`{
            "viewportWidth": 1280, 
            "viewportHeight": 1100
          }`,
          configAfterCode: dedent`module.exports = {
            viewportWidth: 1280, 
            viewportHeight: 1100
          }`,
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
