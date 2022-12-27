import '@packages/frontend-shared/cypress/support/e2e'
import 'cypress-real-events/support'
import './execute-spec'

beforeEach(() => {
  // this is always 0, since we only destroy the AUT when using
  // `experimentalSingleTabRunMode, which is not a valid experiment for for e2e testing.
  // @ts-ignore - dynamically defined during tests using
  expect(window.top?.getEventManager().autDestroyedCount).to.be.undefined
})
