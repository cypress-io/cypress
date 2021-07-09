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
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'vue'
import { eventManager } from '../event-manager'

export default defineComponent({
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