<template>
  <template v-if="props.gql?.projects?.length">
    <!-- If there are projects -->
    <div class="grid pt-6 grid-cols-2 gap-6">
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
        @removeProject="handleRemoveProject"
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
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import { GlobalPageFragment, GlobalPage_AddProjectDocument, GlobalPage_RemoveProjectDocument } from '../generated/graphql'

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
    ...GlobalProjectCard
  }
}
`

gql`
mutation GlobalPage_RemoveProject($path: String!) {
  removeProject(path: $path) {
    projects {
      id
    }
  }
}
`

const addProject = useMutation(GlobalPage_AddProjectDocument)

function handleAddProject (path: string) {
  addProject.executeMutation({ path })
}

const removeProject = useMutation(GlobalPage_RemoveProjectDocument)

function handleRemoveProject (path: string) {
  removeProject.executeMutation({ path })
}

const props = defineProps<{
  gql: GlobalPageFragment,
}>()

const filteredProjects = computed(() => {
  return props.gql.projects.filter((p) => p.title.toLowerCase().indexOf(match.value.toLowerCase()) !== -1)
})

const match = ref('')
</script>
