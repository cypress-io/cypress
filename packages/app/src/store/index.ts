import { createPinia as _createPinia } from 'pinia'

// Pinia client-side storage
export * from './main'

export * from './modals'

export * from './specs'

// Mobx Store Wrapper from @packages/runner-shared
export * from './runner-store'

// Reusable installation function, used as an entry point for tests that
// require an identical setup to main.ts
export const createPinia = () => {
  return _createPinia()
}
