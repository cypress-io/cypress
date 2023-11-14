<template>
  <div class="h-full p-[24px] relative">
    <TransitionQuickFade mode="out-in">
      <RunsSkeleton
        v-if="query.fetching.value || !query.data.value"
        :is-using-git="isUsingGit"
      />
      <RunsContainer
        v-else
        :gql="query.data.value"
        :runs="runs"
        :online="isOnlineRef"
        data-cy="runs-container"
        :all-run-ids="allRunIds"
        :current-commit-info="currentCommitInfo"
        @re-execute-runs-query="reExecuteRunsQuery"
      />
    </TransitionQuickFade>
  </div>
</template>

<script lang="ts" setup>
import { Ref, ref, watchEffect } from 'vue'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsContainer from '../runs/RunsContainer.vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
import { useOnline } from '@vueuse/core'
import { useProjectRuns } from '../runs/useProjectRuns'
import { useGitTreeRuns } from '../runs/useGitTreeRuns'
import type { RunsComposable } from '../runs/RunsComposable'

const isOnlineRef = ref(true)
const online = useOnline()

const isUsingGit = useUserProjectStatusStore().project.isUsingGit

let runComposable: (online: Ref<boolean>) => RunsComposable

if (isUsingGit) {
  runComposable = useGitTreeRuns
} else {
  runComposable = useProjectRuns
}

const { runs, reExecuteRunsQuery, query, allRunIds, currentCommitInfo } = runComposable(isOnlineRef)

watchEffect(() => {
  // We want to keep track of the previous state to refetch the query
  // when the internet connection is back
  if (!online.value && isOnlineRef.value) {
    isOnlineRef.value = false
  }

  if (online.value && !isOnlineRef.value) {
    isOnlineRef.value = true
    reExecuteRunsQuery()
  }
})

</script>
