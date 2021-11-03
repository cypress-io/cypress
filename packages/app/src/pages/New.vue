<template>
  <div class="">
    <CreateSpecPage
      v-if="query.data.value"
      :gql="query.data.value?.app"
    />
  </div>
</template>

<script lang="ts" setup>
import CreateSpecPage from '../specs/CreateSpecPage.vue'
import { useQuery, gql } from '@urql/vue'
import { PagesNewDocument } from '../generated/graphql'

gql`
query PagesNew {
  app {
  ...CreateSpecPage
  }
}
`

const query = useQuery({
  query: PagesNewDocument,
})

</script>
