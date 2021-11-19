<template>
  <SpecRunnerContainer v-if="queryResult" :gql="queryResult" />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { computed } from 'vue'
import { SpecPageContainerDocument, SpecPageContainerQuery, SpecRunnerFragment } from '../generated/graphql'
import SpecRunnerContainer from '../runner/SpecRunnerContainer.vue'
import type { NonNullable } from '@packages/types'

gql`
query SpecPageContainer {
  ...SpecRunner
}
`

const query = useQuery({ query: SpecPageContainerDocument })

export type GqlWithCurrentProject = SpecPageContainerQuery & {
  currentProject: NonNullable<SpecRunnerFragment['currentProject']>
}

const queryResult = computed(() => {
  if (!query.data.value?.currentProject) {
    return null
  }

  // Need to tell TypeScript that we've done the requisite check and currentProject is not null
  return query.data.value as GqlWithCurrentProject
})
</script>

<route>
  {
    meta: {
      header: false
    }
  }
</route>
