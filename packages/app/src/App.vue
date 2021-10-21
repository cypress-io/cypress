<template>
  <router-view v-slot="{ Component }">
    <!--
      TODO(lachlan): put this back after doing proper cleanup when unmounting the runner page
      keep-alive works fine for Vue but has some weird effects on the React based Reporter
      For now it's way more simple to just unmount and remount the components when changing page.
    -->
    <!-- <keep-alive> -->
    <component :is="Component" />
    <!-- </keep-alive> -->
  </router-view>
</template>

<script lang="ts" setup>
import { provide } from 'vue'
import { specStoreKey, createSpecStore } from './composables/specStore'

provide(specStoreKey, createSpecStore())
</script>

<style>
.reporter {
  position: relative;
  width: 100%;
}
</style>
