<template>
  <main class="children:pb-7 children:border-b-1">
    <ExternalEditorSettings/>
    <ProxySettings/>
  </main>
</template>

<script lang="ts" setup>
import ExternalEditorSettings from './ExternalEditorSettings.vue'
import ProxySettings from './ProxySettings.vue'
// import RecordKey from './RecordKey.vue'
// import Experiments from './Experiments.vue'
// import ProjectId from './ProjectId.vue'
</script>

<style lang="scss" scoped>
main {
  > :last-child {
    @apply border-none pb-0;
  }
}
</style>
