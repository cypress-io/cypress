import CompareTestingTypes from './CompareTestingTypes.vue'
import { defaultMessages } from '@cy/i18n'

describe('TestingTypeCards', () => {
  it('renders expected content', () => {
    cy.mount(CompareTestingTypes)
    Object.values(defaultMessages.welcomePage.compareTypes.content).forEach((pieceOfText) =>
      cy.contains(pieceOfText).should('be.visible'))
  })
})
