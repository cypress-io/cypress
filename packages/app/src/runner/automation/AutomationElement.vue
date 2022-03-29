<template>
  <div
    :id="runnerUiStore.automationElementId"
    style="display: none"
  >
    {{ runnerUiStore.randomString }}
  </div>
</template>

<script lang="ts" setup>
import { useRunnerUiStore } from '../../store'

const runnerUiStore = useRunnerUiStore()
</script>
