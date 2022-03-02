<template>
  <div v-if="specStore.activeSpec">
    <SpecRunnerRunMode v-if="initialized" />
  </div>

  <div v-else>
    Error, no spec matched!
  </div>
</template>

<script lang="ts" setup>
import { useSpecStore } from '../store'

import SpecRunnerRunMode from './SpecRunnerRunMode.vue'
import type { SpecFile } from '@packages/types/src'
import { useUnifiedRunner } from './unifiedRunner'
import { ref } from 'vue'
import { getRunModeStaticCypressConfig } from '../utils'

const props = defineProps<{
  runModeSpecs: SpecFile[]
}>()

const specStore = useSpecStore()

const runModeConfig = getRunModeStaticCypressConfig()

const { initialized, watchSpec } = useUnifiedRunner({
  viewportHeight: runModeConfig.viewportHeight,
  viewportWidth: runModeConfig.viewportWidth,
})

watchSpec(ref(props.runModeSpecs))
</script>
