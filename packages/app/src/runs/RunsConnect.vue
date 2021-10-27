<template>
  <div v-if="!isLoggedIn">
    Connect the current user to the cloud (Placeholder)
  </div>
  <div v-else-if="!hasProjectId">
    Connect the current project to the cloud (Placeholder)
  </div>
  <div v-else>
    Something went wrong
  </div>
</template>

<script lang="ts" setup>

defineProps<{
  isLoggedIn: boolean,
  hasProjectId: boolean,
}>()
</script>
