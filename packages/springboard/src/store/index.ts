import { SupportedFramework } from '../supportedFrameworks'
import { reactive, readonly, inject, App } from 'vue'
import { TestingType } from '../types/shared'

interface State {
  testingType: TestingType | undefined
  component: {
    framework: SupportedFramework | undefined
  }
}

function createInitialState (): State {
  return {
    testingType: undefined,
    component: {
      framework: undefined,
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
  const _store = inject<Store>(storeKey)

  if (!_store) {
    throw Error('`store` not found. Did you forget to do `app.use(store)`?')
  }

  return _store
}
