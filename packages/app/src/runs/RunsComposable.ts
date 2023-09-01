import type { Ref } from 'vue'
import type { RunCardFragment } from '../generated/graphql'

export type RunsComposable = {
  runs: Ref<RunCardFragment[] | undefined>
  reExecuteRunsQuery: () => void
  query: any
  allRunIds?: Ref<string[] | undefined>
  currentCommitSha?: Ref<string | undefined>
}
