import type { Ref } from 'vue'
import { onMounted, ref, watch, onBeforeUnmount, readonly } from 'vue'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'

const initialized = ref(false)

export function useUnifiedRunner (specs: Ref<ReadonlyArray<SpecFile>>, queryFile: string) {
  onMounted(async () => {
    await UnifiedRunnerAPI.initialize()
    initialized.value = true
  })

  onBeforeUnmount(() => {
    UnifiedRunnerAPI.teardown()
    initialized.value = false
  })

  const specStore = useSpecStore()
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  watch(specs, () => {
    if (!queryFile) {
      // no file param, we are not showing a file
      // so no action needed when specs list updates
      return
    }

    const activeSpecInSpecsList = specs.value.find((x) => x.relative === queryFile)

    if (!activeSpecInSpecsList) {
      // the specs list no longer contains the spec being shown
      // so set active state to null and let the UI handle it
      specStore.setActiveSpec(null)
    }
  })

  watch(() => queryFile, () => {
    const spec = specs.value.find((x) => x.relative === queryFile)

    if (selectorPlaygroundStore.show) {
      const autIframe = getAutIframeModel()

      autIframe.toggleSelectorPlayground(false)
      selectorPlaygroundStore.setEnabled(false)
      selectorPlaygroundStore.setShow(false)
    }

    specStore.setActiveSpec(spec ?? null)
  }, { immediate: true, flush: 'post' })

  return {
    initialized: readonly(initialized),
  }
}
