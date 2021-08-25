<template>
  <Layout v-slot="{ item }">
    <Wizard v-if="item === 'projectSetup'" />
    <SettingsPage v-if="item === 'settings'" />
    <RunsPage v-if="item === 'runs'" />
  </Layout>
</template>

<script lang="ts" setup>
import {} from '@packages/graphql/src/index'
import { provideClient } from '@urql/vue'
import { makeUrqlClient } from './graphql/urqlClient'
import Layout from "./layouts/Layout.vue"
import SettingsPage from './settings/SettingsPage.vue'
import Wizard from "./setup/Wizard.vue"
import RunsPage from "./runs/RunsPage.vue"

provideClient(makeUrqlClient())
</script>
