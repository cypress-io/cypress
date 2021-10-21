import type { BaseSpec } from '@packages/types/src'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { UnifiedRunnerAPI } from '../runner'

export interface SpecState {
  currentSpec: BaseSpec | null
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      currentSpec: null,
    }
  },

  actions: {
    async setCurrentSpec (currentSpec: BaseSpec) {
      const router = useRouter()

      this.currentSpec = currentSpec
      await router.push({ path: 'runner', query: { spec: currentSpec.relative } })
      UnifiedRunnerAPI.executeSpec(currentSpec)
    },
  },
})
