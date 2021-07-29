<template>
  <!-- <h1>Project Settings</h1> -->
  <!-- <h2>Project ID</h2>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum accusantium molestiae vero magnam quis, vitae sequi, omnis necessitatibus autem voluptate expedita maxime veniam eius minima dolorum est ex delectus atque.</p>
  <input type="text" disabled/><button>Copy</button>
  <h2>Record Key</h2>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum accusantium molestiae vero magnam quis, vitae sequi, omnis necessitatibus autem voluptate expedita maxime veniam eius minima dolorum est ex delectus atque.</p>
  <input type="text" disabled/><button>Copy</button> -->
  <!-- <section class="p-10" v-for="section, idx in sections.project" :key="idx">
  <h2 class="text-xl font-medium text-cool-gray-900 leading-normal">{{ section.title }}</h2>
  <p class="text-sm text-cool-gray-400 leading-snug mb-16px">
    {{ section.description }}
    <a>Learn More.</a>
  </p>
   -->

   <ProjectSettingsSection>
     <template #title>Project ID</template>
     <template #description>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
     <div class="inline-grid grid-flow-col justify-start gap-10px">
      <Input v-model="projectId" disabled type="text" prefixIcon="whh:braces" prefixIconClass="braces" size="sm"/>
      <Button variant="outline">
        <template #prefix>
          <Icon class="text-cool-gray-600" icon="si-glyph:square-dashed-2" />
        </template>
        Copy
      </Button>
     </div>
   </ProjectSettingsSection>

   <ProjectSettingsSection>
     <template #title>Record Key</template>
     <template #description>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae? <a>Learn more</a>.</template>
     <div class="inline-grid grid-flow-col justify-start gap-10px">
      <Input v-model="recordKey" class="max-w-240px" disabled size="sm" :type="showRecordKey ? 'text' : 'password'"/>
      <Button variant="outline" @click="showRecordKey = !showRecordKey">
        <template #prefix>
          <Icon class="text-cool-gray-600" icon="si-glyph:square-dashed-2" />
        </template>
        Copy
      </Button>
      <Button variant="outline" @click="openManageKeys">
        <template #prefix>
          <Icon class="w-1.5em h-1.5em text-cool-gray-600" icon="mdi:axis-x-arrow" />
        </template>
        Manage Keys
      </Button>
     </div>
   </ProjectSettingsSection>

   <ProjectSettingsSection>
     <template #title>Experiments</template>
     <template #description>Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio cum dolorem doloribus voluptate consectetur recusandae?</template>
     <div class="
        mx-auto
        first:border-t-0 border-t-1px border-gray-200
        rounded
        grid
        gap-0
        align-center
        px-16px">
        <ExperimentRow
      v-for="experiment in experiments"
      class="border-t-1 first:border-0 py-20px"
      :key="experiment.key"
      :experiment="experiment"/>
    </div>
     
   </ProjectSettingsSection>
<!-- </section> -->
  <!-- <h2>Resolved Settings</h2>
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum accusantium molestiae vero magnam quis, vitae sequi, omnis necessitatibus autem voluptate expedita maxime veniam eius minima dolorum est ex delectus atque.</p> -->
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import ExperimentRow from './ExperimentRow.vue'
import ProjectSettingsSection from './ProjectSettingsSection.vue'
import { experiments, sections } from './projectSettings'
import Experiments from './Experiments.vue'
import Input from '../components/Input.vue'
import Button from '../components/Button.vue'
import CopyButton from '../components/CopyButton.vue'

const projectSections = {
  experiments: Experiments,
}

export default defineComponent({
  components: { ExperimentRow, ProjectSettingsSection, Input, CopyButton } ,
  setup() {
    return {
      sections,
      experiments,
      showRecordKey: ref(false),
      openManageKeys: () => {},
      projectId: 'oaifhj21',
      recordKey: 'ChRDaHJvbWUvOTIuMC40NTE1LjEwNxIlCahJccAtAjXtEgUNkWGVThIFDZFhlU4SBQ2RYZVOEgUNkWGVTg'
    }
  },
})
</script>

<style>
.braces {
  
}
</style>
