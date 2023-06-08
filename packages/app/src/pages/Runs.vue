<template>
  <div class="h-full p-[24px] relative">
    <TransitionQuickFade mode="out-in">
      <RunsSkeleton v-if="query.fetching.value || !query.data.value" />
      <RunsContainer
        v-else
        :gql="query.data.value"
        :online="isOnlineRef"
        data-cy="runs-container"
        @re-execute-runs-query="reExecuteRunsQuery"
      />
    </TransitionQuickFade>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsContainer from '../runs/RunsContainer.vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'
import { useOnline } from '@vueuse/core'

gql`
query Runs {
  ...RunsContainer
}`

const query = useQuery({ query: RunsDocument, requestPolicy: 'network-only' })

const isOnlineRef = ref(true)
const online = useOnline()

watchEffect(() => {
  // We want to keep track of the previous state to refetch the query
  // when the internet connection is back
  if (!online.value && isOnlineRef.value) {
    isOnlineRef.value = false
  }

  if (online.value && !isOnlineRef.value) {
    isOnlineRef.value = true
    query.executeQuery()
  }
})

function reExecuteRunsQuery () {
  query.executeQuery()
}
</script>
