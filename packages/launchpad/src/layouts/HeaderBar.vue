<template>
  <div class="px-6 py-4 border-b mb-7">
    <div class="flex items-center justify-between max-content">
      <div class="flex items-center">
        <img
          class="mr-2 w-32px h-32px"
          src="../images/cypress-dark.png"
        >
        <span class="text-primary">Projects</span>
        <i-oi-chevron-right class="text-gray-300 h-8px" />
        <span class="text-body-gray-700">{{ props.gql.app.activeProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav />
        <Auth :gql="props.gql" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import type { HeaderBarFragment } from '../generated/graphql'
import TopNav from '../components/topnav/TopNav.vue'
import Auth from '../setup/Auth.vue'

gql`
fragment HeaderBar on Query {
  app {
    activeProject {
      id
      title
    }
  }
  ...Auth
}
`

const props = defineProps<{
  gql: HeaderBarFragment
}>()

</script>
