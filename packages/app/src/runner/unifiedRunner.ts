import { Ref, onMounted, ref, watch, watchEffect, onBeforeUnmount, readonly } from 'vue'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'
import { useRoute } from 'vue-router'
import { getPathForPlatform } from '../paths'

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
    watchSpecs: (specs: Ref<ReadonlyArray<SpecFile>>) => {
      const specStore = useSpecStore()
      const route = useRoute()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()

      watchEffect(() => {
        const queryFile = getPathForPlatform(route.query.file as string)

        if (!queryFile) {
          // no file param, we are not showing a file
          // so no action needed when specs list updates
          return
        }

        const activeSpecInSpecsList = specs.value.find((x) => x.relative === queryFile)

        console.log({ queryFile, activeSpecInSpecsList })
        console.log('watching the effect')
        console.log(specStore.activeSpecs)
        if (activeSpecInSpecsList && (specStore.activeSpecs.length ? specStore.activeSpecs[0].relative !== activeSpecInSpecsList.relative : true)) {
          console.log('set active specs')
          specStore.setActiveSpecs([activeSpecInSpecsList, activeSpecInSpecsList])
        } else if (!activeSpecInSpecsList) {
          specStore.setActiveSpecs([])
        }
      })

      watch(() => getPathForPlatform(route.query.file as string), () => {
        if (selectorPlaygroundStore.show) {
          const autIframe = getAutIframeModel()

          autIframe.toggleSelectorPlayground(false)
          selectorPlaygroundStore.setEnabled(false)
          selectorPlaygroundStore.setShow(false)
        }
      }, { flush: 'post' })
    },
  }
}
