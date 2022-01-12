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
import { automationElementId } from '../event-manager'

const runnerUiStore = useRunnerUiStore()
</script>
