import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { BaseSpec } from '@packages/types'
import { UnifiedRunnerAPI } from '../runner'

/**
 * Centralized way to manage navigation and running of a spec.
 * The spec can change either by user interaction in the app (eg, clicking a button)
 * or by something else (clicking back/forward, push event via web socket, etc).
 *
 * Calling `setSpec` will ensure the URL has the correct query parameter,
 * the currentSpec value is the same as the one in the URL, and (re)-execute
 * the spec.
 */

const currentSpec = ref<BaseSpec>(null)

export function createSpecStore () {
  const router = useRouter()

  async function setSpec (spec: BaseSpec) {
    currentSpec.value = spec
    await router.push({ path: 'runner', query: { spec: spec.relative } })
    UnifiedRunnerAPI.executeSpec(spec)
  }

  return {
    setSpec,
    currentSpec,
  }
}

export function useSpecStore () {
  const _store = inject<ReturnType<typeof createSpecStore>>(specStoreKey)

  if (!_store) {
    throw Error(`Could not find a provided spec store. Did you forget to call provide(specStoreKey, createSpecStore())?`)
  }

  return _store
}

export const specStoreKey = Symbol('spec-store')
