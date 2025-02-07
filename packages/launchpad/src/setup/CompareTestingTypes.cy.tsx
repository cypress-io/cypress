import CompareTestingTypes from './CompareTestingTypes.vue'
// tslint:disable-next-line: no-implicit-dependencies - need to handle this
import { defaultMessages } from '@cy/i18n'

describe('TestingTypeCards', () => {
  it('renders expected content', () => {
    cy.mount(CompareTestingTypes)
    Object.values(defaultMessages.welcomePage.compareTypes.content).forEach((pieceOfText) =>
      cy.contains(pieceOfText).should('be.visible'))
  })
})
