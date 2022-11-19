import { RUN_ALL_SPECS_KEY } from '@packages/types/src'
import { gql, useMutation, useQuery } from '@urql/vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RunAllSpecsDocument, RunAllSpecs_ConfigDocument } from '../generated/graphql'

type ResolvedConfig = { value: any, from: 'string', field: string }[]

gql`
query RunAllSpecs_Config {
  currentProject {
    id
    config
    currentTestingType
  }
}
`

gql`
mutation RunAllSpecs ($specPath: String!, $runAllSpecs: [String!]!) {
  setRunAllSpecs(runAllSpecs: $runAllSpecs)
  launchOpenProject(specPath: $specPath) {
    id
  }
} 
`

const isRunMode = window.__CYPRESS_MODE__ === 'run' && window.top === window

export function useRunAllSpecs () {
  const router = useRouter()
  const query = useQuery({ query: RunAllSpecs_ConfigDocument, pause: isRunMode })
  const setRunAllSpecsMutation = useMutation(RunAllSpecsDocument)

  return {
    runAllSpecs: async (runAllSpecs: string[]) => {
      await setRunAllSpecsMutation.executeMutation({ runAllSpecs, specPath: RUN_ALL_SPECS_KEY })

      // Won't execute unless we are testing since the browser gets killed. In testing,
      // we can stub `launchProject` to verify the functionality is working
      router.push({ path: '/specs/runner', query: { file: RUN_ALL_SPECS_KEY } })
    },
    isRunAllSpecsAllowed: computed(() => {
      const isE2E = query.data.value?.currentProject?.currentTestingType === 'e2e'

      const config: ResolvedConfig = query.data.value?.currentProject?.config || []
      const hasExperiment = config.find(({ field, value }) => field === 'experimentalRunAllSpecs' && value === true)

      return Boolean(isE2E && hasExperiment)
    }),
  }
}
