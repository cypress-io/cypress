import { onMounted, ref, watch, onBeforeUnmount, readonly, Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'

const initialized = ref(false)

export function useUnifiedRunner () {
  onMounted(async () => {
    await UnifiedRunnerAPI.initialize()
    initialized.value = true
  })

  onBeforeUnmount(() => {
    UnifiedRunnerAPI.teardown()
    initialized.value = false
  })

  return {
    initialized: readonly(initialized),

    watchSpec: (specs: Ref<ReadonlyArray<SpecFile>>) => {
      const specStore = useSpecStore()
      const route = useRoute()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      return watch(() => route.query.file, (queryParam) => {
        const spec = specs.value.find((x) => x.relative === queryParam)

        if (selectorPlaygroundStore.show) {
          const autIframe = getAutIframeModel()

          autIframe.toggleSelectorPlayground(false)
          selectorPlaygroundStore.setEnabled(false)
          selectorPlaygroundStore.setShow(false)
        }

        specStore.setActiveSpec(spec ?? null)
      }, { immediate: true, flush: 'post' })
    },
  }
}
