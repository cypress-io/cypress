<template>
  <main class="children:pt-7 children:pb-7 children:border-b-1">
    <ExternalEditorSettings class="pt-0"/>
    <ProxySettings/>
  </main>
</template>

<script lang="ts" setup>
import ExternalEditorSettings from './ExternalEditorSettings.vue'
import ProxySettings from './ProxySettings.vue'
</script>

<style lang="scss" scoped>
main {
  > :last-child {
    @apply border-none pb-0;
  }
}
</style>
