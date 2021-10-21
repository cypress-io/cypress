import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseSpec } from '@packages/types'
import { UnifiedRunnerAPI } from '../runner'

/**
 * Centralized way to manage navigation and access to the the current spec.
 * The source of truth is the ?spec=... query parameter, so rather than
 * duplicating the state, we just derive it from the current route.
 */

const currentSpec = ref<BaseSpec>(null)

export function useSpecStore () {
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
