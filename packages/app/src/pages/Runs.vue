<template>
  <div class="relative p-24px h-full overflow-y-scroll">
    <transition
      name="fade"
    >
      <RunsSkeleton v-if="query.fetching.value || !query.data.value" />
      <RunsPage
        v-else
        :gql="query.data.value"
      />
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { RunsDocument } from '../generated/graphql'
import RunsSkeleton from '../runs/RunsSkeleton.vue'
import RunsPage from '../runs/RunsPage.vue'

gql`
query Runs {
  ...RunsPage
}`

const query = useQuery({ query: RunsDocument })
</script>

<route>
{
  name: "Runs",
  meta: {
    title: "Runs"
  }
}
</route>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity .3s
}

.fade-enter-from, .fade-leave-to {
  opacity: 0
}
</style>
