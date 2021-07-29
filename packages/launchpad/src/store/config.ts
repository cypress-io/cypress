import { reactive, readonly, inject, App } from 'vue'
import { TestingTypeEnum } from '../generated/graphql'
import { Bundler } from '../utils/bundler'
import { Framework } from '../utils/frameworks'
import { StoreApp } from './app'

interface ComponentSetup {
  framework: Framework
  bundler: Bundler
}

interface StateConfig {
  firstOpen: boolean
  testingType?: TestingTypeEnum
  component?: ComponentSetup
}

function createInitialState (): StateConfig {
  return {
    firstOpen: true,
  }
}

const storeKey = Symbol('storeConfig')

export class StoreConfig {
  private readonly state: StateConfig;
  private readonly storeApp: StoreApp

  install (app: App) {
    app.provide(storeKey, this)
  }

  constructor (storeApp: StoreApp, initialState: StateConfig) {
    this.state = reactive(initialState)
    this.storeApp = storeApp
  }

  getState () {
    return readonly(this.state)
  }

  setTestingType (testingType?: TestingTypeEnum) {
    this.state.testingType = testingType
    if (testingType === 'component') {
      this.storeApp.flagComponent()
    }
  }

  setComponentSetup (options: ComponentSetup) {
    this.state.component = options
    this.storeApp.flagComponentSetup()
  }
}

// useful for testing
export function createStoreConfig (storeApp: StoreApp, stateOverrides: Partial<StateConfig> = {}) {
  return new StoreConfig(storeApp, {
    ...createInitialState(),
    ...stateOverrides,
  })
}

export const useStoreConfig = (): StoreConfig => {
  const _store = inject<StoreConfig>(storeKey)

  if (!_store) {
    throw Error('`storeConfig` not found. Did you forget to do `app.use(store)`?')
  }

  return _store
}
