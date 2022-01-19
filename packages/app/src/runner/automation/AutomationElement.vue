<template>
  <div
    :id="automationElementId"
    style="display: none"
  >
    {{ runnerUiStore.randomString }}
  </div>
</template>

<script lang="ts" setup>
import { useRunnerUiStore } from '../../store'

const automationElementId = window.__CYPRESS_CONFIG__.namespace
const runnerUiStore = useRunnerUiStore()
</script>
