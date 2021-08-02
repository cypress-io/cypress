<template>
  <Layout>
    <Wizard />
  </Layout>
</template>

<script lang="ts" setup>
import { provideClient } from '@urql/vue'
import { makeUrqlClient } from './graphql/urqlClient'
import Layout from "./components/Layout.vue"
import Wizard from "./components/Wizard.vue"

provideClient(makeUrqlClient())
</script>
