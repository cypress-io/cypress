<template>
  <div class="h-full p-24px relative">
    <TransitionQuickFade>
      <RunsSkeleton v-if="query.fetching.value || !query.data.value" />
      <RunsContainer
        v-else
        :gql="query.data.value"
        @reexecute-runs-query="reexecuteRunsQuery"
      />
    </TransitionQuickFade>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsContainer from '../runs/RunsContainer.vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'

gql`
query Runs {
  ...RunsContainer
}`

const query = useQuery({ query: RunsDocument, requestPolicy: 'network-only' })

function reexecuteRunsQuery () {
  query.executeQuery()
}
</script>
