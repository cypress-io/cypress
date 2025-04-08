import { RUN_ALL_SPECS_KEY } from '@packages/types/src'
import { gql, useMutation, useQuery } from '@urql/vue'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RunAllSpecsDataDocument, RunAllSpecsDocument } from '../generated/graphql'
import { getSeparator, SpecTreeNode, UseCollapsibleTreeNode } from '../specs/tree/useCollapsibleTree'
import { isRunMode } from '@packages/frontend-shared/src/utils/isRunMode'

type ResolvedConfig = Array<{ value: any, from: string, field: string }>

gql`
query RunAllSpecsData {
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
  launchOpenProject(specPath: $specPath, shouldLaunchNewTab: true) {
    id
  }
}
`

// TODO: This is a "setup store" - see https://pinia.vuejs.org/core-concepts/#setup-stores
// Can we make it an "options store" like the others? https://pinia.vuejs.org/core-concepts/#option-stores
export const useRunAllSpecsStore = defineStore('runAllSpecs', () => {
  const allSpecsRef = ref<string[]>([])
  const directoryChildrenRef = ref<Record<string, string[]>>({})

  const separator = getSeparator()
  const router = useRouter()
  const setRunAllSpecsMutation = useMutation(RunAllSpecsDocument)

  async function runSpecs (runAllSpecs: string[]) {
    await setRunAllSpecsMutation.executeMutation({ runAllSpecs, specPath: RUN_ALL_SPECS_KEY })

    // Won't execute unless we are testing since the browser gets killed. In testing,
    // we can stub `launchProject` to verify the functionality is working
    await router.push({ path: '/specs/runner', query: { file: RUN_ALL_SPECS_KEY } })
  }

  async function runAllSpecs () {
    await runSpecs(allSpecsRef.value)
  }

  async function runSelectedSpecs (dir: string) {
    await runSpecs(directoryChildrenRef.value[dir])
  }

  function setRunAllSpecsData (tree: UseCollapsibleTreeNode<SpecTreeNode>[]) {
    const allSpecs: string[] = []
    const directoryChildren: Record<string, string[]> = {}

    for (const { id, isLeaf } of tree) {
      if (!isLeaf) {
        directoryChildren[id] = []
      } else {
        allSpecs.push(id)

        Object.keys(directoryChildren).forEach((dir) => {
          if (id.startsWith(dir) && id.replace(dir, '').startsWith(separator)) {
            directoryChildren[dir].push(id)
          }
        })
      }
    }

    allSpecsRef.value = allSpecs
    directoryChildrenRef.value = directoryChildren
  }

  const query = useQuery({ query: RunAllSpecsDataDocument, pause: isRunMode || window.__CYPRESS_TESTING_TYPE__ === 'component' })

  const isRunAllSpecsAllowed = computed(() => {
    const isE2E = query.data.value?.currentProject?.currentTestingType === 'e2e'

    const config: ResolvedConfig = query.data.value?.currentProject?.config || []
    const hasExperiment = config.some(({ field, value }) => field === 'experimentalRunAllSpecs' && value === true)

    return (isE2E && hasExperiment)
  })

  return {
    isRunAllSpecsAllowed,
    directoryChildren: directoryChildrenRef,
    runAllSpecs,
    allSpecsRef,
    runSelectedSpecs,
    setRunAllSpecsData,
  }
})
