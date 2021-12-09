<template>
  <SpecRunnerContainer
    v-if="query.data.value?.currentProject"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { onMounted } from 'vue-demi'
import { SpecPageContainerDocument } from '../generated/graphql'
import SpecRunnerContainer from '../runner/SpecRunnerContainer.vue'

gql`
query SpecPageContainer {
  ...SpecRunner
}
`

const query = useQuery({ query: SpecPageContainerDocument })
onMounted(() => {
  query.then((res) => {console.log(res.data.value)})
  console.log('gogogo', query.data.value)
})
</script>

<route>
  {
    meta: {
      header: false
    }
  }
</route>
