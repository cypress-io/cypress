import { expect } from 'chai'
import { createTestDataContext } from '../helper'
import { ProjectConfigManager } from '../../../src/data/ProjectConfigManager'
import { EventRegistrar } from '../../../src/data/EventRegistrar'

let configManager: ProjectConfigManager

describe('ProjectConfigManager', () => {
  beforeEach(() => {
    const ctx = createTestDataContext('open')

    configManager = new ProjectConfigManager({
      ctx,
      configFile: false,
      projectRoot: 'test/root',
      handlers: [],
      hasCypressEnvFile: false,
      eventRegistrar: new EventRegistrar(),
      onError: (error) => {},
      onInitialConfigLoaded: () => {},
      onFinalConfigLoaded: () => Promise.resolve(),
      refreshLifecycle: () => Promise.resolve(),
    })
  })

  context('#eventProcessPid', () => {
    it('returns process id from events ipc', () => {
      // @ts-expect-error
      configManager._eventsIpc = {
        childProcessPid: 45699,
      }

      expect(configManager.eventProcessPid).to.eq(45699)
    })

    it('does not throw if config manager is not initialized', () => {
      // @ts-expect-error
      configManager._eventsIpc = undefined
      expect(configManager.eventProcessPid).to.eq(undefined)
    })
  })
})
