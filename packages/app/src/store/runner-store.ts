import { BaseStore } from '@packages/runner-shared/src/store'

export class MobxRunnerStore extends BaseStore {}

export let mobxRunnerStore: MobxRunnerStore

export function initializeStore (testingType: Cypress.TestingType) {
  mobxRunnerStore = new MobxRunnerStore(testingType)

  return mobxRunnerStore
}

export function getStore () {
  if (!mobxRunnerStore) {
    throw Error('Must initialize mobxRunnerStore with testingType before accessing it!')
  }

  return mobxRunnerStore
}
