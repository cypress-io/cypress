import { AutIframe } from '../../../src/runner/aut-iframe'
import { EventManager } from '../../../src/runner/event-manager'
import type { Socket } from '@packages/socket/lib/browser'

export const StubWebsocket = new Proxy<Socket>(Object.create(null), {
  get: (obj, prop) => {
    throw Error(`Cannot access ${String(prop)} on StubWebsocket!`)
  },
})

beforeEach(() => {
  if (!window.top?.getEventManager) {
    throw Error('Could not find `window.top.getEventManager`. Expected `getEventManager` to be defined.')
  }

  // this is always undefined, since we only define it when
  // running CT with a project that sets `experimentalSingleTabRunMode: true`
  // @ts-ignore - dynamically defined during tests using
  expect(window.top.getEventManager().autDestroyedCount).to.be.undefined
})

// Event manager with Cypress driver dependencies stubbed out
// Useful for component testing
export const createEventManager = () => {
  return new EventManager(
    null, // packages/driver, not needed for CT tests
    // @ts-ignore
    null, // MobX, also not needed in Vue CT tests,
    null, // selectorPlaygroundModel,
    StubWebsocket,
  )
}

const mockDom = {
  addOrUpdateSelectorPlaygroundHighlight: () => {},
  scrollIntoView: () => {},
  getElements: () => {},
}

// Stub AutIframe, useful for component testing
export const createTestAutIframe = (eventManager = createEventManager()) => {
  eventManager._testingOnlySetCypress({
    dom: mockDom,
  })

  return new AutIframe(
    'Test Project',
    eventManager,
    null, // CypressJQuery, shouldn't be using driver in component tests anyway
  )
}
