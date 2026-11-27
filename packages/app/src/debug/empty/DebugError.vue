<template>
  <DebugEmptyView
    title="Git repository not detected"
    description="Cypress uses Git to associate runs with your local state. Please ensure that Git is properly configured for your project."
    :icon="IconTechnologyCommandLineError"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'

</script>
