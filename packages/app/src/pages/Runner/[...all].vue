<template>
  <div>
    <h2>Runner Page</h2>

    <div v-once>
      <div :id="RUNNER_ID" />
      <div :id="REPORTER_ID" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import type { SpecFile } from '@packages/types/src'
import { UnifiedRunnerAPI } from '../../runner'
import { REPORTER_ID, RUNNER_ID } from '../../runner/utils'
import { useRoute } from 'vue-router'

onMounted(() => {
  UnifiedRunnerAPI.initialize(executeSpec)
})

const route = useRoute()

function executeSpec () {
  const absolute = route.hash.slice(1)

  if (absolute) {
    // @ts-ignore
    execute({
      absolute,
      relative: `src/Basic.spec.tsx`,
      name: `Basic.spec.tsx`,
    })
  }
}

const execute = (spec?: SpecFile) => {
  if (!spec) {
    return
  }

  UnifiedRunnerAPI.executeSpec(spec)
}
</script>

<route>
{
  name: "Runner"
}
</route>
