<template>
  <SpecRunnerContainer
    v-if="query.data.value?.currentProject"
    :gql="query.data.value.currentProject"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SpecPageContainerDocument } from '../generated/graphql'
import SpecRunnerContainer from '../runner/SpecRunnerContainer.vue'
import { getEventManager } from '../runner'
import { useSpecStore } from '../store'

import { watchEffect } from 'vue'

gql`
query SpecPageContainer {
  currentProject {
    id
    ...SpecRunner
  }
}
`

const query = useQuery({ query: SpecPageContainerDocument })
const specStore = useSpecStore()

watchEffect(() => {
  if (specStore.isRunnerInitialized) {
    const eventManager = getEventManager()

    eventManager.on('save:app:state', () => {
      query.executeQuery()
    })
  }
})

</script>

<route>
  {
    meta: {
      header: false
    }
  }
</route>
