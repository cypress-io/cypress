<template>
  <div class="flex items-center py-4 px-6 mb-8 justify-between border-b">
    <div class="flex items-center ">
      <img class="w-32px h-32px mr-2" src="../images/cypress-dark.png" />
      <span class="text-primary">Projects</span> 
      <i-oi-chevron-right class="text-gray-200 h-8px" />
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