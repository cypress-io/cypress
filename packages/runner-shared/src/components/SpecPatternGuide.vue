<template>
  <input v-model="pattern" />
  <p>Files:</p>
  <ul>
    <li
      v-for="file of matchingFiles"
      :key="file"
      data-cy="file"
    >
      {{ file }}
    </li>
  </ul>
  <p>
    When you have selected a pattern, update {{ configFile }}:
  </p>
  <pre><code>module.exports = {
  {{runnerType}}: (on, config) => {
    return {
      ...config,
      testFiles: '{{ pattern }}'
    }
  }
}   </code>
  </pre>
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect, PropType } from 'vue'
import { RunnerType } from '@packages/server/lib/specs-store'
import { eventManager } from '../event-manager'

export default defineComponent({
  props: {
    runnerType: {
      type: String as PropType<RunnerType>,
      required: true
    },
    configFile: {
      type: String,
      required: true
    }
  },
  setup() {
    const pattern = ref('*')
    const matchingFiles = ref<string[]>([])

    watchEffect(() => {
      eventManager._getProjectFiles(pattern.value, (files: string[]) => {
        matchingFiles.value = files
      })
    })

    return {
      pattern,
      matchingFiles,
    }
  }
})
</script>
