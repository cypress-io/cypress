<template>
  <div class="h-full p-24px relative">
    <TransitionQuickFade>
      <RunsSkeleton v-if="query.fetching.value || !query.data.value" />
      <RunsPage
        v-else
        :gql="query.data.value"
      />
    </TransitionQuickFade>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsPage from '../runs/RunsContainer.vue'
import TransitionQuickFade from '@cy/components/transitions/TransitionQuickFade.vue'

gql`
query Runs {
  ...RunsContainer
}`

const query = useQuery({ query: RunsDocument })
</script>
