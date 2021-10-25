<template>
  <div v-if="query.data.value?.app?.activeProject">
    <SpecRunnerContainer
      :gql="query.data.value.app"
    />
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../generated/graphql'
import SpecRunnerContainer from './SpecRunnerContainer.vue'

gql`
query SpecPageContainer {
  app {
    ...SpecRunner
  }
}
`

const query = useQuery({ query: SpecPageContainerDocument })

</script>
