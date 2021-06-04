import { SupportedFramework } from '../supportedFrameworks'
import { reactive, readonly, inject, App } from 'vue'
import { TestingType } from '../types/shared'

type PackageManagerType = 'yarn' | 'npm' | undefined

interface PackageManager {
  type: PackageManagerType
  loaded: boolean
}

interface State {
  testingType: TestingType | undefined
  component: {
    framework: SupportedFramework | undefined
    packageManager: PackageManager
  }
}

function createInitialState (): State {
  return {
    testingType: undefined,
    component: {
      framework: undefined,
      packageManager: {
        loaded: false,
        type: undefined,
      },
    },
  }
}

const storeKey = Symbol('store')

class Store {
  private state: State

  install (app: App) {
    app.provide(storeKey, this)
  }

  constructor (initialState: State) {
    this.state = reactive(initialState)
  }

  getState () {
    return readonly(this.state)
  }

  setTestingType (testingType: TestingType) {
    this.state.testingType = testingType
  }

  setPackageManager (type: PackageManagerType) {
    this.state.component.packageManager = {
      type,
      loaded: true,
    }
  }

  setComponentFramework (framework: SupportedFramework) {
    this.state.component.framework = framework
  }
}

// useful for testing
export function createStore (initialState: State = createInitialState()) {
  return new Store(initialState)
}

export const store = new Store(createInitialState())

export const useStore = (): Store => {
  // try provide via `inject`
  const _store = inject<Store>(storeKey)

  // we need to access the store *outside* the Vue hierarchy sometimes,
  // for example to respond to events from the ipc,
  // so we just return the global singleton.
  if (!_store) {
    return store
  }

  return _store
}
