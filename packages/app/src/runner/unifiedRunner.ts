import type { Ref } from 'vue'
import { onMounted, ref, watch, onBeforeUnmount, readonly, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'

const initialized = ref(false)
const newSpecs = ref<ReadonlyArray<SpecFile>>([])

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
      // Making specs reactive, we ensure that the value is up to date
      // with the latest specs coming from gql
      watchEffect(() => {
        newSpecs.value = specs.value
      })

      const specStore = useSpecStore()
      const route = useRoute()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      return watch(() => route.query.file, (queryParam) => {
        const spec = newSpecs.value.find((x) => x.relative === queryParam)

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
