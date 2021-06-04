import { SupportedFramework } from '../supportedFrameworks'
import { reactive, readonly, inject, App, getCurrentInstance } from 'vue'
import { TestingType } from '../types/shared'

type PackageManagerType = 'yarn' | 'npm' | undefined

interface PackageManager {
  type: PackageManagerType
  loaded: boolean
}

export interface State {
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
  if (!getCurrentInstance()) {
    // we are *outside* the Vue hierarchy.
    // Eg: using the store to respond to events from the ipc.
    // so we just return the global singleton.
    return store
  }

  const _store = inject<Store>(storeKey)

  if (!_store) {
    throw Error('store could not be injected. Did you forgot to do app.provide(store)?')
  }

  return _store
}
