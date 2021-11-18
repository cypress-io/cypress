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

  <StandardModal
    v-model="isChooseEditorOpen"
    variant="bare"
    help-link=""
  >
    <template #title>
      {{ t("globalPage.selectPreferredEditor") }}
    </template>

    <div class="m-24px">
      <ChooseExternalEditor
        v-if="props.gql.localSettings"
        :gql="props.gql"
      />
      <div
        v-else
        class="h-full flex items-center justify-center"
      >
        <i-cy-loading_x16 class="animate-spin icon-dark-white icon-light-gray-400" />
      </div>
    </div>
  </StandardModal>

  <button @click="isChooseEditorOpen = !isChooseEditorOpen">
    toggle
  </button>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import { GlobalPageFragment, GlobalPage_AddProjectDocument, GlobalPage_OpenInIdeDocument, GlobalPage_RemoveProjectDocument, GlobalProjectCardFragment, GlobalPage_OpenInFinderDocument } from '../generated/graphql'
import StandardModal from '@packages/frontend-shared/src/components/StandardModal.vue'
import ChooseExternalEditor from '@packages/frontend-shared/src/gql-components/ChooseExternalEditor.vue'

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
  ...ChooseExternalEditor
}
`

gql`
mutation GlobalPage_RemoveProject($path: String!) {
  removeProject(path: $path) 
}

mutation GlobalPage_OpenInIDE ($path: String!) {
  openInIDE(path: $path)
}

mutation GlobalPage_OpenInFinder ($path: String!) {
  openInFinder(path: $path)
}
`

const addProject = useMutation(GlobalPage_AddProjectDocument)
const openInIDE = useMutation(GlobalPage_OpenInIdeDocument)
const openInFinder = useMutation(GlobalPage_OpenInFinderDocument)

function handleAddProject (path: string) {
  addProject.executeMutation({ path })
}

function handleOpenInFinder (path: string) {
  openInFinder.executeMutation({ path })
}

function handleOpenInIDE (path: string) {
  openInIDE.executeMutation({ path })
}

const removeProject = useMutation(GlobalPage_RemoveProjectDocument)

function handleRemoveProject (path: string) {
  removeProject.executeMutation({ path })
}

const props = defineProps<{
  gql: GlobalPageFragment,
}>()

const filteredProjects = computed(() => {
  return (props.gql.projects as GlobalProjectCardFragment[]).filter((p) => p.title.toLowerCase().indexOf(match.value.toLowerCase()) !== -1)
})

const match = ref('')
const isChooseEditorOpen = ref(false)
const { t } = useI18n()
</script>
