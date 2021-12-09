<template>
  <SpecRunnerContainer
    v-if="query.data.value?.currentProject"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../../generated/graphql'
import SpecRunnerContainer from '../../runner/SpecRunnerContainer.vue'

gql`
query SpecPageContainer {
  ...SpecRunner
}
`

const query = useQuery({ query: SpecPageContainerDocument })
</script>

<route>
  {
    meta: {
      header: false,
      navBarExpandedAllowed: false
    }
  }
</route>
