<template>
  <main class="children:pt-7 children:pb-7 children:border-b-1">
    <ProjectId class="pt-0"/>
    <RecordKey />
    <Experiments />
  </main>
</template>

<script lang="ts" setup>
import RecordKey from './RecordKey.vue'
import Experiments from './Experiments.vue'
import ProjectId from './ProjectId.vue'
</script>

<style lang="scss" scoped>
main {
  > :last-child {
    @apply border-none pb-0;
  }
}
</style>
