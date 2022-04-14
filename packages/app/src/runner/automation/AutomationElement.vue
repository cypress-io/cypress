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
import { UnifiedRunnerAPI } from '../index'

const automationElementId = UnifiedRunnerAPI.getAutomationElementId()
const runnerUiStore = useRunnerUiStore()
</script>
