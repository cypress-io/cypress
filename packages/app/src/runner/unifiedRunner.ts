import { Ref, onMounted, ref, watch, watchEffect, onBeforeUnmount, readonly } from 'vue'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { RUN_ALL_SPECS, RUN_ALL_SPECS_KEY, SpecFile } from '@packages/types/src'
import { LocationQuery, useRoute } from 'vue-router'
import { getPathForPlatform } from '../paths'
import { isEqual } from 'lodash'
import { gql, useMutation } from '@urql/vue'
import { TestsForRunDocument } from '../generated/graphql'

gql`
mutation TestsForRun ($runId: String!) {
  testsForRun (runId: $runId)
}
`

const initialized = ref(false)

export function useUnifiedRunner () {
  let prevQuery: LocationQuery

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
      const testsForRunMutation = useMutation(TestsForRunDocument)

      watchEffect(async () => {
        const queryFile = getPathForPlatform(route.query.file as string)

        if (!queryFile) {
          // no file param, we are not showing a file
          // so no action needed when specs list updates
          return
        }

        const activeSpecInSpecsList = queryFile === RUN_ALL_SPECS_KEY
          ? RUN_ALL_SPECS
          : specs.value.find((x) => x.relative === queryFile)

        if (isEqual(route.query, prevQuery) && isEqual(activeSpecInSpecsList, specStore.activeSpec)) {
          return
        }

        prevQuery = route.query

        if (!activeSpecInSpecsList) {
          return specStore.setActiveSpec(null)
        }

        if (route.query.runId) {
          const res = await testsForRunMutation.executeMutation({ runId: route.query.runId as string })

          specStore.setTestFilter(res.data?.testsForRun?.length ? res.data.testsForRun : undefined)
        } else {
          specStore.setTestFilter(undefined)
        }

        // Either there is a new spec or the runId has changed. Returning a new object
        // will kick off a new run
        specStore.setActiveSpec({ ...activeSpecInSpecsList })
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
