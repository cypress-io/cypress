import { BaseStore } from '@packages/runner-shared/src/store'

export class MobxRunnerStore extends BaseStore {}

let mobxRunnerStore: MobxRunnerStore

export function initializeMobXStore (testingType: Cypress.TestingType) {
  mobxRunnerStore = new MobxRunnerStore(testingType)

  return mobxRunnerStore
}

export function getMobXStore () {
  if (!mobxRunnerStore) {
    throw Error('Must initialize store with testingType before accessing it!')
  }

  return mobxRunnerStore
}
