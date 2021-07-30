<template>
  <Layout>
    <Wizard />
  </Layout>
</template>

<script lang="ts">
import { provideApolloClient } from '@vue/apollo-composable'
import { makeApolloClient } from './graphql/apolloClient'
import { defineComponent } from "vue";
import Layout from "./components/Layout.vue";
import Wizard from "./components/Wizard.vue";

import { createClient, provideClient } from '@urql/vue'

const client = createClient({
  url: 'http://localhost:52159/graphql',
});

export default defineComponent({
  name: "App",
  components: {
    Layout,
    Wizard,
  },
  setup() {
    provideClient(client);
    provideApolloClient(makeApolloClient())
  }
});
</script>
