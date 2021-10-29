import { EventManager } from '../../../src/runner/event-manager'

class StudioRecorderMock {}

export const createEventManager = () => {
  return new EventManager(
    null, // packages/driver, not needed for CT tests
    // @ts-ignore
    null, // MobX, also not needed in Vue CT tests,
    null, // selectorPlaygroundModel,
    StudioRecorderMock, // needs to be a valid class
  )
}
