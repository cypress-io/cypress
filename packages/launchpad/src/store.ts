import { reactive, readonly, inject, App } from 'vue'
import { Bundler } from './statics/bundler'
import { Framework } from './statics/frameworks'
import { TestingType } from './statics/testingTypes'

type ComponentSetup = {
  framework: Framework
  bundler: Bundler
  complete: boolean
};

interface State {
  title: string
  description: string
  testingType?: TestingType
  firstOpen: boolean
  component?: ComponentSetup
  nextAction: () => void
  backAction: () => void
  alternativeAction?: () => void
}

function createInitialState (): State {
  return {
    title: 'Welcome to Cypress',
    description:
      'Before we get started with testing your project, please confirm which method of testing you would like to use for the initial tests that you’ll be writing.',
    firstOpen: true,
    nextAction () {},
    backAction () {},
  }
}

const storeKey = Symbol('store')

export class Store {
  private state: State;

  install (app: App) {
    app.provide(storeKey, this)
  }

  constructor (initialState: State) {
    this.state = reactive(initialState)
  }

  getState () {
    return readonly(this.state)
  }

  setMeta (meta: { title: string, description: string }) {
    this.state.title = meta.title
    this.state.description = meta.description
  }

  setTestingType (testingType?: TestingType) {
    this.state.testingType = testingType
  }

  setComponentSetup (options: ComponentSetup) {
    this.state.component = options
  }

  resetComponentSetup () {
    if (this.state.component) {
      this.state.component.complete = false
    }
  }

  setNextFunction (newNext: () => void) {
    this.state.nextAction = newNext
  }

  setBackFunction (newBack: () => void) {
    this.state.backAction = newBack
  }

  setAltFunction (newAlt: () => void) {
    this.state.alternativeAction = newAlt
  }
}

// useful for testing
export function createStore (stateOverrides: Partial<State> = {}) {
  return new Store({
    ...createInitialState(),
    ...stateOverrides,
  })
}

export const store = new Store(createInitialState())

export const useStore = (): Store => {
  const _store = inject<Store>(storeKey)

  if (!_store) {
    throw Error('`store` not found. Did you forget to do `app.use(store)`?')
  }

  return _store
}
