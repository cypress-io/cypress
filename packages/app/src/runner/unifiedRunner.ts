import { Ref, onMounted, ref, watch, watchEffect, onBeforeUnmount, readonly, computed } from 'vue'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { SpecWithFilter, useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { RUN_ALL_SPECS, RUN_ALL_SPECS_KEY, SpecFile } from '@packages/types/src'
import { LocationQuery, useRoute } from 'vue-router'
import { getPathForPlatform } from '../paths'
import { isEqual } from 'lodash'
import { gql, useQuery } from '@urql/vue'
import { TestsForRunDocument } from '../generated/graphql'

gql`
query TestsForRun ($runId: String!) {
  currentProject {
    id
    testsForRun (runId: $runId) {
      status
      titlePath
    }
  }
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
      const runId = computed(() => route.query.runId as string)
      const query = useQuery({ query: TestsForRunDocument, pause: true, requestPolicy: 'network-only', variables: { runId: runId as any } })

      watchEffect(async () => {
        const queryFile = getPathForPlatform(route.query.file as string)

        if (!queryFile || isEqual(route.query, prevQuery)) {
          // no file param, we are not showing a file
          // so no action needed when specs list updates
          return
        }

        prevQuery = route.query

        if (queryFile === RUN_ALL_SPECS_KEY) {
          return specStore.setActiveSpec(RUN_ALL_SPECS)
        }

        let activeSpecInSpecsList: SpecWithFilter | undefined = specs.value.find((x) => x.relative === queryFile)

        if (!activeSpecInSpecsList) {
          return specStore.setActiveSpec(null)
        }

        if (route.query.runId) {
          const queryRes = await query.executeQuery({ runId: route.query.runId })
          const testResults = queryRes.data.value?.currentProject?.testsForRun || []

          const failedTests = (queryRes.data.value?.currentProject?.testsForRun || []).reduce<string[]>((acc, test) => {
            if (test.status === 'FAILED') acc.push(test.titlePath)

            return acc
          }, [])

          if (failedTests.length) {
            activeSpecInSpecsList = { ...activeSpecInSpecsList, testFilter: { tests: failedTests, total: testResults.length } }
          }
        }

        if (!isEqual(activeSpecInSpecsList, specStore.activeSpec)) {
          specStore.setActiveSpec(activeSpecInSpecsList)
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
