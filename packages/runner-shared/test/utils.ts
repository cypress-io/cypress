import $Cypress from '@packages/driver'
import { EventManager } from '@packages/app/src/runner/event-manager'
import { StubWebsocket } from '@packages/app/cypress/component/support/ctSupport'
import { StudioRecorder } from '../src/studio'
import { selectorPlaygroundModel } from '../src/selector-playground'
import * as MobX from 'mobx'

export const createEventManager = () => {
  return new EventManager(
    $Cypress,
    MobX,
    selectorPlaygroundModel,
    StudioRecorder,
    StubWebsocket,
  )
}
