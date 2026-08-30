import { nanoid } from 'nanoid'
import { action, observable, makeObservable } from 'mobx'

export class MobxRunnerStore {
  spec?: Cypress.Spec
  specRunId?: string

  constructor () {
    makeObservable(this, {
      spec: observable,
      specRunId: observable,
      setSpec: action,
    })
  }

  setSpec (spec: Cypress.Spec | undefined) {
    this.spec = spec
    this.specRunId = nanoid()
  }
}

export function getMobxRunnerStore () {
  if (!mobxRunnerStore) {
    throw Error('mobxRunnerStore is undefined! Need to call initializeMobxStore')
  }

  return mobxRunnerStore
}

export const initializeMobxStore = () => {
  mobxRunnerStore = new MobxRunnerStore()

  return mobxRunnerStore
}

let mobxRunnerStore: MobxRunnerStore
