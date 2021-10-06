<template>
  <template v-if="props.gql?.projects?.length">
    <!-- Welcome Guide can fetch its own information for if it should render -->
    <WelcomeGuide />

    <!-- If there are projects -->
    <div class="grid grid-cols-1 gap-6 pt-6 grid-cols-2">
      <div class="min-w-full col-start-1 col-end-3 flex items-center gap-6">
        <GlobalPageHeader
          v-model="match"
          @add-project="handleAddProject"
        />
      </div>

      <GlobalProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :gql="project"
      />
    </div>
  </template>

  <!-- Else, show the empty state -->
  <GlobalEmpty
    v-else
    @add-project="handleAddProject"
  />
</template>

<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import WelcomeGuide from './WelcomeGuide.vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import { GlobalPageFragment, GlobalPage_AddProjectDocument } from '../generated/graphql'

gql`
mutation GlobalPage_addProject($path: String!, $open: Boolean = true) {
  addProject(path: $path, open: $open) {
    projects {
      id
      title
      projectId
      projectRoot
      isFirstTimeCT
      isFirstTimeE2E
    }
  }
}
`

gql`
fragment GlobalPage on App {
  projects {
    ...GlobalProjectCard_Project
  }
}
`

const addProject = useMutation(GlobalPage_AddProjectDocument)

function handleAddProject (path: string) {
  addProject.executeMutation({ path })
}

const props = defineProps<{
  gql: GlobalPageFragment,
}>()

const filteredProjects = computed(() => {
  return props.gql.projects.filter((p) => p.title.toLowerCase().indexOf(match.value.toLowerCase()) !== -1)
})

const match = ref('')
</script>
