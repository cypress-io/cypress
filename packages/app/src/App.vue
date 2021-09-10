<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { renderRunner } from './runner/renderRunner'

const target = ref(null)

onMounted(async () => {
  const config = await (await fetch('/__/api')).json()
  renderRunner(() => {
    // @ts-ignore - yes it does
    window.Runner.start(target.value, config.base64Config)
  })
})
</script>

<template>
  <div id="target" ref="target"></div>
</template>