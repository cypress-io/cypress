import type { Ref } from 'vue'
import type { RunCardFragment } from '../generated/graphql'

export type RunsComposable = {
  currentProject: any
  runs: Ref<RunCardFragment[] | undefined>
  reExecuteRunsQuery: () => void
  query: any
}
