<template>
  <DebugEmptyView
    title="No runs found for your branch"
    description="Cypress uses Git to show runs for your branch. Ensure that version control is properly configured and that you are sending Git information to Cypress Cloud."
    :icon="IconTechnologyCommandLineError"
    :utm="utm"
    help-link-href="https://on.cypress.io/git-info"
  />
</template>

<script lang="ts" setup>
import DebugEmptyView from './DebugEmptyView.vue'
import { IconTechnologyCommandLineError } from '@cypress-design/vue-icon'

const utm = {
  utm_campaign: 'No Runs Found',
}

</script>
