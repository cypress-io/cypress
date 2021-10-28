import { createPinia as _createPinia } from 'pinia'

// Pinia client-side storage
export * from './main-store'

export * from './modals'

export * from './specs-store'

export * from './aut-store'

// Mobx Store Wrapper from @packages/runner-shared
export * from './mobx-runner-store'

// Reusable installation function, used as an entry point for tests that
// require an identical setup to main.ts
export const createPinia = () => {
  return _createPinia()
}
