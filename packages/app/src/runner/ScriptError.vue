<template>
  <pre
    class="text-red-500 bg-white p-24px overflow-auto h-[calc(100%-70px)] whitespace-pre-wrap break-all text-sm"
    v-html="scriptError"
  />
</template>

<script setup lang="ts">
import ansiToHtml from 'ansi-to-html'
import { computed } from 'vue'

const convert = new ansiToHtml({
  fg: '#000',
  bg: '#fff',
  newline: false,
  escapeXML: true,
  stream: false,
})

const props = defineProps<{ error: string }>()

const scriptError = computed(() => convert.toHtml(props.error))

</script>
