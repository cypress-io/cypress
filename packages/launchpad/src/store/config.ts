import { reactive, readonly, inject, App } from 'vue'
import { Bundler } from '../utils/bundler'
import { Framework } from '../utils/frameworks'
import { TestingType } from '../utils/testingTypes'
import { StoreApp, storeApp } from './app'

type ComponentSetup = {
  framework: Framework
  bundler: Bundler
};

interface StateConfig {
  firstOpen: boolean
  testingType?: TestingType
  component?: ComponentSetup
}

function createInitialState (): StateConfig {
  return {
    firstOpen: true,
  }
}

const storeKey = Symbol('storeConfig')

export class StoreConfig {
  private state: StateConfig;
  private storeApp: StoreApp

  install (app: App) {
    app.provide(storeKey, this)
    this.storeApp = storeApp
  }

  constructor (initialState: StateConfig) {
    this.state = reactive(initialState)
  }

  getState () {
    return readonly(this.state)
  }

  setTestingType (testingType?: TestingType) {
    this.state.testingType = testingType
    this.storeApp.flagTestingType()
  }

  setComponentSetup (options: ComponentSetup) {
    this.state.component = options
    this.storeApp.flagComponentSetup()
  }
}

// useful for testing
export function createStore (stateOverrides: Partial<StateConfig> = {}) {
  return new StoreConfig({
    ...createInitialState(),
    ...stateOverrides,
  })
}

export const storeConfig = new StoreConfig(createInitialState())

export const useStoreConfig = (): StoreConfig => {
  const _store = inject<StoreConfig>(storeKey)

  if (!_store) {
    throw Error('`storeConfig` not found. Did you forget to do `app.use(store)`?')
  }

  return _store
}
