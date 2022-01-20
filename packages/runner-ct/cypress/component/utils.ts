import * as MobX from 'mobx'
import $Cypress from '@packages/driver'
import { selectorPlaygroundModel, StudioRecorder } from '@packages/runner-shared'
import { EventManager } from '@packages/app/src/runner/event-manager'
import State from '../../src/lib/state'
import { StubWebsocket } from '@packages/app/cypress/component/support/ctSupport'

export const fakeConfig = { projectName: 'Project', env: {}, isTextTerminal: false } as Partial<Cypress.RuntimeConfigOptions>

export const makeState = (options = {}) => {
  return (new State({
    reporterWidth: 500,
    spec: null,
    specs: [{ relative: '/test.js', absolute: 'root/test.js', name: 'test.js' }],
    ...options,
  }, fakeConfig))
}

export const getPort = (href: string) => {
  const [, port] = href.match(/localhost:(.+?)\//)

  return port
}

export const createEventManager = () => {
  return new EventManager(
    $Cypress,
    MobX,
    selectorPlaygroundModel,
    StudioRecorder,
    StubWebsocket,
  )
}
