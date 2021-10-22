import { createPinia as _createPinia } from 'pinia'

// Pinia client-side storage
export * from './main'

export * from './modals'

// Mobx Store Wrapper from @packages/runner-shared
export * from './runner-store'

// Wrapped pinia methods
export { storeToRefs } from 'pinia'

// Reusable installation function, used as an entry point for tests that
// require an identical setup to main.ts
export const createPinia = () => {
  return _createPinia()
}
