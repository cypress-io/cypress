<template>
  <Layout>
    <Wizard />
  </Layout>
</template>

<script lang="ts" setup>
import { provideClient } from '@urql/vue'
import { makeUrqlClient } from './graphql/urqlClient'
import Layout from "./layouts/Layout.vue"
import Wizard from "./setup/Wizard.vue"

provideClient(makeUrqlClient())
</script>
