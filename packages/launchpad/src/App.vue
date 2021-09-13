<template>
  <div v-if="!backendInitialized || !query.data.value">
    Loading...
  </div>

  <div v-else class="bg-white h-full">
    <HeaderBar :gql="query.data.value" />
    <Wizard :gql="query.data.value" />
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { gql, useQuery } from '@urql/vue'
import Wizard from "./setup/Wizard.vue"
import HeaderBar from './layouts/HeaderBar.vue'
import { AppQueryDocument } from './generated/graphql'

gql`
query AppQuery {
  ...Wizard
  ...HeaderBar
}
`

/**
 * Sometimes the electron app can start before the GraphQL
 * server and current project has been initialized.
 * We poll until those conditions are met, then render the app
 */
const query = useQuery({ 
  query: AppQueryDocument,
  requestPolicy: 'cache-and-network'
})


watch(query.data, () => {
  console.log(query.data.value)
})

let interval: number

const poll = () => {
  try {
    if (backendInitialized.value) {
      window.clearInterval(interval)
    } else {
      query.executeQuery()
    }
  } catch (e) {
    // probably graphql server has not initialized yet
  }
}

interval = window.setInterval(poll, 200)

const backendInitialized = computed(() => !!query.data?.value?.app?.activeProject)
</script>

<style lang="scss">
html, body, #app {
  @apply h-full;
}
</style>