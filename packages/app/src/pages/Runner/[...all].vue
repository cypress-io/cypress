<template>
  <Runner
    v-if="query.data.value?.app && initialized"
    :gql="query.data.value.app"
  />
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useQuery } from '@urql/vue'
import { onMounted, ref } from 'vue'
import { Runner_AllDocument } from '../../generated/graphql'
import { UnifiedRunnerAPI } from '../../runner'
import Runner from '../../runs/Runner.vue'

gql`
query Runner_All {
  app {
    ...Specs_Runner
  }
}
`

const initialized = ref(false)

onMounted(() => {
  UnifiedRunnerAPI.initialize(() => {
    initialized.value = true
  })
})


// network-only - we do not want to execute a stale spec
const query = useQuery({
  query: Runner_AllDocument,
  requestPolicy: 'network-only',
})
</script>

<route>
{
  name: "Runner"
}
</route>
