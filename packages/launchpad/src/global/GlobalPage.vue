<template>
  <template v-if="props.gql?.projects?.length">
    <!-- If there are projects -->
    <GlobalPageHeader
      v-model="match"
      :project-count="filteredProjects?.length"
      @add-project="handleAddProject"
    />
    <h2
      v-if="filteredProjects.length"
      class="text-gray-800 mb-16px"
    >
      {{ t('globalPage.recentProjectsHeader') }}
    </h2>
    <div :class="{ 'md:grid md:grid-cols-2 md:gap-24px mb-0': filteredProjects?.length > 1 }">
      <GlobalProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :gql="project"
        class="mb-24px md:mb-0"
        @removeProject="handleRemoveProject"
        @openInFinder="handleOpenInFinder"
        @openInIDE="handleOpenInIDE"
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
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import { GlobalPageFragment, GlobalPage_AddProjectDocument, GlobalPage_RemoveProjectDocument } from '../generated/graphql'

gql`
mutation GlobalPage_addProject($path: String!, $open: Boolean = true) {
  addProject(path: $path, open: $open) 
}
`

gql`
fragment GlobalPage on Query {
  projects {
    ...GlobalProjectCard
  }
}
`

gql`
mutation GlobalPage_RemoveProject($path: String!) {
  removeProject(path: $path) 
}
`

const addProject = useMutation(GlobalPage_AddProjectDocument)

function handleAddProject (path: string) {
  addProject.executeMutation({ path })
}

function handleOpenInFinder (path: string) {
  // todo - add gql mutation for this action
}

function handleOpenInIDE (path: string) {
  // todo - add gql mutation for this action
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
const { t } = useI18n()
</script>
