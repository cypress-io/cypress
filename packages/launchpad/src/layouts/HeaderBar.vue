<template>
  <div class="flex items-center justify-between px-6 py-4 border-b">
    <div class="flex items-center ">
      <img class="mr-2 w-32px h-32px" src="../images/cypress-dark.png" />
      <span class="text-primary">Projects</span> 
      <i-oi-chevron-right class="text-gray-300 h-8px" />
      <span class="text-body-gray-700">{{ props.gql.app.activeProject?.title }}</span>
    </div>
    <div>
      <Auth :gql="props.gql" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql } from '@urql/vue'
import type { HeaderBarFragment } from '../generated/graphql'
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