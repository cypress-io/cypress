import { reactive, readonly, inject, App } from 'vue'

interface State {
  projectTitle: string
  title: string
  description: string
  nextAction: () => void
  backAction: () => void
  alternativeAction?: () => void
  steps: {
      component?: boolean
      setup?: boolean
      dependencies?: boolean
      configFile?: boolean

      e2e?: boolean
  }
}

function createInitialState (): State {
  return {
    projectTitle: 'design-system',
    title: 'LaunchPad',
    description: 'Scaffold Cypress Tests',
    nextAction () {},
    backAction () {},
    steps: {},
  }
}

const storeKey = Symbol('storeApp')

export class StoreApp {
  private readonly state: State;

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

  flagComponent (flag = true) {
    this.state.steps.component = flag
  }

  flagComponentSetup (flag = true) {
    this.state.steps.setup = flag
  }

  flagDependenciesInstalled (flag = true) {
    this.state.steps.dependencies = flag
  }

  finishSetup () {
    this.state.steps.configFile = true
  }

  onNext (newNext: () => void) {
    this.state.nextAction = newNext
  }

  onBack (newBack: () => void) {
    this.state.backAction = newBack
  }

  onAlt (newAlt: () => void) {
    this.state.alternativeAction = newAlt
  }
}

// useful for testing
export function createStoreApp (stateOverrides: Partial<State> = {}) {
  return new StoreApp({
    ...createInitialState(),
    ...stateOverrides,
  })
}

export const useStoreApp = (): StoreApp => {
  const _store = inject<StoreApp>(storeKey)

  if (!_store) {
    throw Error('`storeApp` not found. Did you forget to do `app.use(store)`?')
  }

  return _store
}
