<template>
  <Layout v-slot="{ item }">
    <Wizard v-if="item === 'projectSetup'" />
    <SettingsPage v-if="item === 'settings'" />
  </Layout>
</template>

<script lang="ts" setup>
import { provideClient } from '@urql/vue'
import { makeUrqlClient } from './graphql/urqlClient'
import Layout from "./layouts/Layout.vue"
import SettingsPage from './settings/SettingsPage.vue'
import Wizard from "./setup/Wizard.vue"

provideClient(makeUrqlClient())
</script>
