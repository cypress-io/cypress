<template>
  <div class="bg-gray-100 flex items-center p-2 mb-8 justify-between">
    <div class="flex items-center">
      <img
        src="../images/cypress_s.png"
        class="p-2"
      >
      Projects > {{ props.gql.app.activeProject?.title }}
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
