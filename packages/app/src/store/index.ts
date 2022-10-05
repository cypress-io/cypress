import { createPinia as _createPinia } from 'pinia'

export * from './specs-store'

export * from './aut-store'

export * from './runner-ui-store'

export * from './mobx-runner-store'

export * from './selector-playground-store'

export * from './screenshot-store'

// Reusable installation function, used as an entry point for tests that
// require an identical setup to main.ts
export const createPinia = () => {
  return _createPinia()
}
