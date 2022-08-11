import '@packages/frontend-shared/cypress/e2e/support/e2eSupport'
import 'cypress-real-events/support'
import './execute-spec'

beforeEach(() => {
  // this is always 0, since we only destroy the AUT when using
  // `experimentalSingleTabRunMode, which is not a valid experiment for for e2e testing.
  // @ts-expect-error
  expect(window.top.getEventManager().autDestroyedCount).to.eq(0)
})
