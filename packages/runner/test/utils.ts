import $Cypress from '@packages/driver'
import { EventManager } from '@packages/app/src/runner/event-manager'
import type { Socket } from '@packages/socket/lib/browser'
import { StudioRecorder } from '../src/studio'
import * as MobX from 'mobx'

export const StubWebsocket = new Proxy<Socket>(Object.create(null), {
  get: (obj, prop) => {
    throw Error(`Cannot access ${String(prop)} on StubWebsocket!`)
  },
})

export const createEventManager = () => {
  return new EventManager(
    $Cypress,
    MobX,
    {}, // TODO: Bring back "Cypress Studio" and integrate with 10.x runner // selectorPlaygroundModel
    StudioRecorder,
    StubWebsocket,
  )
}
