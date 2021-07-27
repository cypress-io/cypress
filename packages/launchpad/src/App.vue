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

export default defineComponent({
  name: "App",
  components: {
    Layout,
    Wizard,
  },
  setup() {
    provideApolloClient(makeApolloClient())
  }
});
</script>
