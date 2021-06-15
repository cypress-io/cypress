import type { TestingType } from '../types/shared'
import type { SupportedFramework } from '../types/supportedFrameworks'

export interface State {
  testingType: TestingType | undefined
  firstOpen: boolean
  hasDismissedHelper: boolean
  component: {
    framework: SupportedFramework | undefined
  }
}

// function createInitialState (): State {
//   return {
//     firstOpen: true,
//     hasDismissedHelper: false,
//     testingType: undefined,
//     component: {
//       framework: undefined,
//     },
//   }
// }

// const storeKey = Symbol('store')

// class Store {
//   private state: State

//   install (app: App) {
//     app.provide(storeKey, this)
//   }

//   constructor (initialState: State) {
//     this.state = reactive(initialState)
//   }

//   getState () {
//     return readonly(this.state)
//   }

//   setTestingType (testingType: TestingType) {
//     this.state.testingType = testingType
//   }

//   setDismissedHelper (hasDismissed) {
//     this.state.hasDismissedHelper = hasDismissed
//   }

//   setComponentFramework (framework: SupportedFramework) {
//     this.state.component.framework = framework
//   }
// }

// // useful for testing
// export function createStore (stateOverrides = {}) {
//   return new Store({
//     ...createInitialState(),
//     ...stateOverrides,
//   })
// }

// export const store = new Store(createInitialState())

// export const useStore = (): Store => {
//   const _store = inject<Store>(storeKey)

//   if (!_store) {
//     throw Error('`store` not found. Did you forget to do `app.use(store)`?')
//   }

//   return _store
// }
