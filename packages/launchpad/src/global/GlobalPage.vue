<template>
  <template v-if="props.gql?.projects?.length">
    <!-- If there are projects -->
    <GlobalPageHeader
      v-model="match"
      :project-count="filteredProjects?.length"
      @add-project="handleAddProject"
    />
    <h1
      v-if="filteredProjects.length"
      class="mb-[16px] text-gray-800"
    >
      {{ t('globalPage.recentProjectsHeader') }}
    </h1>
    <div
      :class="{ 'md:grid md:grid-cols-2 md:gap-[24px] mb-0': filteredProjects?.length > 1 }"
    >
      <GlobalProjectCard
        v-for="project in filteredProjects"
        :key="project.id"
        :gql="project"
        class="mb-[24px] md:mb-0"
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

  <ChooseExternalEditorModal
    :open="isChooseEditorOpen"
    :gql="props.gql"
    @close="isChooseEditorOpen = false"
    @selected="editorChosen"
  />
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import { computed, ref } from 'vue'
import { gql, useMutation } from '@urql/vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'
import type { GlobalPageFragment, GlobalProjectCardFragment } from '../generated/graphql'
import { GlobalPage_AddProjectDocument, GlobalPage_OpenDirectoryInIdeDocument, GlobalPage_RemoveProjectDocument, GlobalPage_OpenInFinderDocument } from '../generated/graphql'
import ChooseExternalEditorModal from '@packages/frontend-shared/src/gql-components/ChooseExternalEditorModal.vue'

gql`
mutation GlobalPage_addProject($path: String, $open: Boolean = true) {
  addProject(path: $path, open: $open) {
    ...GlobalPage
  }
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
  removeProject(path: $path) {
    ...GlobalPage
  }
}

mutation GlobalPage_OpenDirectoryInIDE ($path: String!) {
  openDirectoryInIDE(path: $path)
}

mutation GlobalPage_OpenInFinder ($path: String!) {
  openInFinder(path: $path)
}
`

const addProject = useMutation(GlobalPage_AddProjectDocument)
const openDirectoryInIDE = useMutation(GlobalPage_OpenDirectoryInIdeDocument)
const openInFinder = useMutation(GlobalPage_OpenInFinderDocument)

function handleAddProject (path: string | null) {
  addProject.executeMutation({ path })
}

function handleOpenInFinder (path: string) {
  openInFinder.executeMutation({ path })
}

let projectPathToOpen: string

function editorChosen () {
  isChooseEditorOpen.value = false
  openDirectoryInIDE.executeMutation({ path: projectPathToOpen })
}

function handleOpenInIDE (path: string) {
  if (!props.gql.localSettings.preferences.preferredEditorBinary) {
    projectPathToOpen = path
    isChooseEditorOpen.value = true
  } else {
    openDirectoryInIDE.executeMutation({ path })
  }
}

const removeProject = useMutation(GlobalPage_RemoveProjectDocument)

function handleRemoveProject (path: string) {
  removeProject.executeMutation({ path })
}

const props = defineProps<{
  gql: GlobalPageFragment
}>()

function matchedGlobalProjects (project: typeof props.gql.projects[number]): project is GlobalProjectCardFragment {
  return project.__typename === 'GlobalProject' && project.title.toLowerCase().includes(match.value.toLowerCase())
}

const filteredProjects = computed(() => {
  return (props.gql.projects || []).filter(matchedGlobalProjects)
})

const match = ref('')
const isChooseEditorOpen = ref(false)
const { t } = useI18n()
</script>
