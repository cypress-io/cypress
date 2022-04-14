import type { Ref } from 'vue'
import { onMounted, ref, watch, onBeforeUnmount, readonly } from 'vue'
import { useRoute } from 'vue-router'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'
import { getPathForPlatform } from '../paths'

const initialized = ref(false)
let specsWatcher
let specWatcher

export function useUnifiedRunner () {
  onMounted(async () => {
    await UnifiedRunnerAPI.initialize()
    initialized.value = true
  })

  onBeforeUnmount(() => {
    UnifiedRunnerAPI.teardown()
    initialized.value = false

    if (specsWatcher) {
      specsWatcher()
    }

    if (specWatcher) {
      specWatcher()
    }
  })

  return {
    initialized: readonly(initialized),

    watchSpec: (specs: Ref<ReadonlyArray<SpecFile>>) => {
      const specStore = useSpecStore()
      const route = useRoute()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      specsWatcher = watch(() => specs.value, (newVal) => {
        const fileParam = getPathForPlatform(route.query.file as string)

        if (!fileParam) {
          // no file param, we are not showing a file
          // so no action needed when specs list updates
          return
        }

        const activeSpecInSpecsList = newVal.find((x) => x.relative === fileParam)

        if (!activeSpecInSpecsList) {
          // the specs list no longer contains the spec being shown
          // so set active state to null and let the UI handle it
          specStore.setActiveSpec(null)
        }
      })

      specWatcher = watch(() => getPathForPlatform(route.query.file as string), (queryParam) => {
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
