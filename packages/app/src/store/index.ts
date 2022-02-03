import { createPinia as _createPinia } from 'pinia'

export * from './specs-store'

export * from './aut-store'

export * from './runner-ui-store'

// Mobx Store Wrapper from @packages/runner-shared
export * from './mobx-runner-store'

// Reusable installation function, used as an entry point for tests that
// require an identical setup to main.ts
export const createPinia = () => {
  return _createPinia()
}
