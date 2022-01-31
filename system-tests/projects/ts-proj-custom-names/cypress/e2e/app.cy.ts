import { add } from './math'

it('is true', () => {
  expect(add(1, 2)).to.eq(3)
})

it('uses custom command', () => {
  // defined in support file
  cy.customCommand()
})
