<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimeoutFn } from '../../shared'
import { useDocumentVisibility } from '.'

const startMessage = '💡 Minimize the page or switch tab then return'
const message = ref(startMessage)
const visibility = useDocumentVisibility()

const timeout = useTimeoutFn(() => {
  message.value = startMessage
}, 3000)

watch(visibility, (current, previous) => {
  if (current === 'visible' && previous === 'hidden') {
    message.value = '🎉 Welcome back!'
    timeout.start()
  }
})
</script>

<template>
  <div>{{ message }}</div>
</template>
