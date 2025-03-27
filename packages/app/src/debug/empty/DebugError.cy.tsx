import DebugError from './DebugError.vue'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

describe('<DebugError />', () => {
  it('can mount', () => {
    cy.mount(<DebugError />)
    cy.contains(defaultMessages.debugPage.emptyStates.gitRepositoryNotDetected)
    cy.contains(defaultMessages.debugPage.emptyStates.ensureGitSetupCorrectly)
  })
})
