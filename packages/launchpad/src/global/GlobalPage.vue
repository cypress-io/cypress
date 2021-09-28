<template>
  <template v-if="props.gql?.projects?.length">
    <!-- Welcome Guide can fetch its own information for if it should render -->
    <WelcomeGuide />

    <!-- If there are projects -->
    <div class="grid grid-cols-1 gap-6 pt-6 grid-cols-2">
      <div class="min-w-full col-start-1 col-end-3 flex items-center gap-6">
        <GlobalPageHeader v-model="match" />
      </div>

      <GlobalProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :gql="project"
      />
    </div>
  </template>

  <!-- Else, show the empty state -->
  <GlobalEmpty v-else />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { gql } from "@urql/core";
import WelcomeGuide from './WelcomeGuide.vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import type { GlobalPageFragment } from "../generated/graphql"

gql`
fragment GlobalPage on App {
  projects {
    ...GlobalProjectCard_Project
  }
}
`

const props = defineProps<{
  gql: GlobalPageFragment,
}>()

const filteredProjects = computed(() => {
  return props.gql.projects.filter(p => p.title.toLowerCase().indexOf(match.value.toLowerCase()) !== -1)
})

const match = ref('')
</script>
