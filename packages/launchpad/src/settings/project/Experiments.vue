<template>
  <ProjectSettingsSection>
    <template #title>Experiments</template>
    <template
      #description
    >Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
    <div
      class="mx-auto first:border-t-0 border-gray-200 rounded grid gap-0 align-center border px-16px"
    >
      <ExperimentRow
        v-for="experiment in localExperiments"
        data-testid="experiment"
        class="border-t-1 first:border-0 py-20px"
        :key="experiment.key"
        :experiment="experiment"
      />
    </div>
  </ProjectSettingsSection>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue'
import ExperimentRow from './ExperimentRow.vue'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import { experiments as defaultExperiments } from './projectSettings'
import type { Experiment } from './projectSettings'

const props = defineProps<{
  experiments?: Experiment[]
}>()

const localExperiments = computed(() => props.experiments || defaultExperiments)
</script>
