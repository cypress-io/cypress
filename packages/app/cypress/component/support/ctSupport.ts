import { AutIframe } from '../../../src/runner/aut-iframe'
import { EventManager } from '../../../src/runner/event-manager'
import { logger } from '@packages/runner-shared/src/logger'
import { blankContents } from '@packages/runner-shared/src/blank-contents'
import _ from 'lodash'
import { visitFailure } from '@packages/runner-shared/src/visit-failure'
import type { Socket } from '@packages/socket/lib/browser'

class StudioRecorderMock {}

export const StubWebsocket = new Proxy<Socket>(Object.create(null), {
  get: (obj, prop) => {
    throw Error(`Cannot access ${String(prop)} on StubWebsocket!`)
  },
})

// Event manager with Cypress driver dependencies stubbed out
// Useful for component testing
export const createEventManager = () => {
  return new EventManager(
    null, // packages/driver, not needed for CT tests
    // @ts-ignore
    null, // MobX, also not needed in Vue CT tests,
    null, // selectorPlaygroundModel,
    StudioRecorderMock, // needs to be a valid class
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
    _,
    null, // CypressJQuery, shouldn't be using driver in component tests anyway
    logger,
    // dom - imports driver which causes problems
    // so just stubbing it out for now
    mockDom,
    visitFailure,
    eventManager.studioRecorder,
    blankContents,
  )
}
