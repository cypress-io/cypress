import { createApp, reactive } from 'vue'
import { defaultDocument } from '../_configurable'

function withScope<T extends object>(factory: () => T): T {
  let state: T = null as any

  const document = defaultDocument

  if (document) {
    const container = document.createElement('div')
    createApp({
      setup() {
        state = reactive(factory()) as T
      },
      render: () => null,
    }).mount(container)
  }
  else {
    state = reactive(factory()) as T
  }

  return state
}

/**
 * Keep states in the global scope to be reusable across Vue instances.
 *
 * @see https://vueuse.org/createGlobalState
 * @param stateFactory A factory function to create the state
 */
export function createGlobalState<T extends object>(
  stateFactory: () => T,
) {
  let state: T

  return () => {
    if (state == null)
      state = withScope(stateFactory)

    return state
  }
}

export type CreateGlobalStateReturn = ReturnType<typeof createGlobalState>
