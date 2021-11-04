<template>
  <SpecRunnerContainer
    v-if="query.data.value?.app?.currentProject"
    :gql="query.data.value.app"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../generated/graphql'
import SpecRunnerContainer from '../runner/SpecRunnerContainer.vue'

gql`
query SpecPageContainer {
  app {
    ...SpecRunner
  }
}
`

const query = useQuery({ query: SpecPageContainerDocument })
</script>

<route>
  {
    meta: {
      header: false
    }
  }
</route>
