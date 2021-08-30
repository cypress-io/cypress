<template>
  <div v-if="!backendInitialized || !query.data.value">
    Loading...
  </div>

  <div v-else>
    <Layout v-slot="{ item }">
      <Wizard 
        v-if="item === 'projectSetup'" 
        :query="query.data.value"
      />
      <SettingsPage v-if="item === 'settings'" />
      <RunsPage v-if="item === 'runs'" />
    </Layout>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql, useQuery } from '@urql/vue'
import Layout from "./layouts/Layout.vue"
import SettingsPage from './settings/SettingsPage.vue'
import Wizard from "./setup/Wizard.vue"
import { AppQueryDocument } from './generated/graphql'
import RunsPage from "./runs/RunsPage.vue"

gql`
query AppQuery {
  ...Wizard
  app {
    activeProject {
      __typename
    }
  }
}
`

/**
 * Sometimes the electron app can start before the GraphQL
 * server and current project has been initialized.
 * We poll until those conditions are met, then render the app
 */
const query = useQuery({ 
  query: AppQueryDocument,
  requestPolicy: 'network-only'
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
