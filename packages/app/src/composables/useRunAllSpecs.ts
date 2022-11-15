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
mutation RunAllSpecs ($runAllSpecs: [String!]!) {
  setRunAllSpecs(runAllSpecs: $runAllSpecs)
  launchOpenProject(specPath: "__all") {
    id
  }
} 
`

export function useRunAllSpecs () {
  const router = useRouter()
  const query = useQuery({ query: RunAllSpecs_ConfigDocument })
  const setRunAllSpecsMutation = useMutation(RunAllSpecsDocument)

  return {
    runAllSpecs: async (runAllSpecs: string[]) => {
      await setRunAllSpecsMutation.executeMutation({ runAllSpecs })

      // Won't execute unless we are testing since the browser gets killed. In testing,
      // we can stub `launchProject` to verify the functionality is working
      router.push({ path: '/specs/runner', query: { file: '__all' } })
    },
    isRunAllSpecsAllowed: computed(() => {
      const isE2E = query.data.value?.currentProject?.currentTestingType === 'e2e'

      const config: ResolvedConfig = query.data.value?.currentProject?.config || []
      const hasExperiment = config.find(({ field, value }) => field === 'experimentalRunAllSpecs' && value === true)

      return Boolean(isE2E && hasExperiment)
    }),
  }
}
