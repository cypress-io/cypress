<template>
  <main class="divide-y divide-gray-200 children:pt-7 children:pb-7">
    <ProjectId class="pt-0"/>
    <RecordKey />
    <Experiments />
    <Config />
  </main>
</template>

<script lang="ts" setup>
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'
import Config from './Config.vue'
</script>
