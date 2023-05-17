import DebugError from './DebugError.vue'
import { defaultMessages } from '@cy/i18n'

describe('<DebugError />', () => {
  it('can mount', () => {
    cy.mount(<DebugError />)
    cy.contains(defaultMessages.debugPage.emptyStates.gitRepositoryNotDetected)
    cy.contains(defaultMessages.debugPage.emptyStates.ensureGitSetupCorrectly)
  })
})
