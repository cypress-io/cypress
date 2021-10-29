import $Cypress from '@packages/driver'
import { EventManager } from '../src/event-manager'
import { StudioRecorder } from '../src/studio'
import { selectorPlaygroundModel } from '../src/selector-playground'
import * as MobX from 'mobx'

export const createEventManager = () => {
  return new EventManager(
    $Cypress,
    MobX,
    selectorPlaygroundModel,
    StudioRecorder,
  )
}
