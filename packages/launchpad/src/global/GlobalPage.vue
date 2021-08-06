<template>
  <template v-if="projects.length">
    <!-- Welcome Guide can fetch its own information for if it should render -->
    <WelcomeGuide />

    <!-- If there are projects -->
    <div class="grid grid-cols-1 gap-6 pt-6 grid-cols-2">
      <div class="min-w-full col-start-1 col-end-3 flex items-center gap-6">
        <GlobalPageHeader v-model="match" />
      </div>

      <GlobalProjectCard v-for="project, idx in filteredProjects" :key="idx" :project="project" />
    </div>
  </template>

  <!-- Else, show the empty state -->
  <GlobalEmpty v-else />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import WelcomeGuide from './WelcomeGuide.vue'
import GlobalProjectCard from './GlobalProjectCard.vue'
import GlobalPageHeader from './GlobalPageHeader.vue'
import GlobalEmpty from './GlobalEmpty.vue'

type Project = {
  name: string,
  lastRunStatus: 'passed' | 'failed' | 'pending'
  lastRun: number
}

const testProject: Project = {
  name: 'Project Name',
  lastRunStatus: 'passed',
  lastRun: Date.now() - 1000 * 60 * 60 * 24 * 255 // 255 days ago
}

// I don't know why this isn't type checking correctly
// but it'll be deleted momentarily when this data is pulled in from gql
// @ts-ignore
const projects: Ref<Project[]> = ref([
  testProject,
  {
    name: 'Project Name 2',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 100 // 100 days ago
  },
  {
    name: 'Fifty Days Ago',
    lastRunStatus: 'pending',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 50 // 50 days ago
  },
  {
    name: 'Ten Days ago',
    lastRunStatus: 'passed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 10 // 10 days ago
  },
  {
    name: 'Five days',
    lastRunStatus: 'passed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
  },
  {
    name: 'Project Name 6',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 1 // 1 day ago
  },
  {
    name: 'Project Name 6',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 1 // 1 day ago
  },
  {
    name: 'Project Name 6',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 1 // 1 day ago
  },
  {
    name: 'Project Name 6',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 1 // 1 day ago
  },
  {
    name: 'Project Name 7',
    lastRunStatus: 'passed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 0 // today
  },
  {
    name: 'Project Name 8',
    lastRunStatus: 'failed',
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 0 // yesterday
  },
])

const filteredProjects = computed(() => {
  return projects.value.filter(p => p.name.toLowerCase().indexOf(match.value.toLowerCase()) !== -1)
})

const match = ref('')
</script>
