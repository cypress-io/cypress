import { BaseStore } from '@packages/runner-shared/src/store'

export class Store extends BaseStore {}

let store: Store

export function initializeStore (testingType: Cypress.TestingType) {
  store = new Store(testingType)

  return store
}

export function getStore () {
  if (!store) {
    throw Error('Must initialize store with testingType before accessing it!')
  }

  return store
}
