<template>
  <pre
    class="bg-white text-sm p-[24px] text-red-500 overflow-auto whitespace-pre-wrap break-all"
    :style="style"
    v-html="scriptError"
  />
</template>

<script setup lang="ts">
import ansiToHtml from 'ansi-to-html'
import { computed } from 'vue'
import { useAutStore } from '../store'

const autStore = useAutStore()
const convert = new ansiToHtml({
  fg: '#000',
  bg: '#fff',
  newline: false,
  escapeXML: true,
  stream: false,
})

const props = defineProps<{ error: string }>()

const scriptError = computed(() => convert.toHtml(props.error))
const style = computed(() => `height: calc(100vh - ${autStore.specRunnerHeaderHeight + 32}px)`)

</script>
