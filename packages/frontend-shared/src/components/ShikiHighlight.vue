<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'
import { highlighter, initHighlighter } from '../highlighter'

const highlighterInitialized = ref(false)

onBeforeMount(async () => {
  await initHighlighter()
  highlighterInitialized.value = true
})

const props = defineProps<{
  code: string;
  lang: 'javascript' | 'typescript' | 'json' | 'js' | 'ts';
}>()

const resolvedLang = computed(() => 'js' === props.lang ? 'javascript' : 'ts' === props.lang ? 'typescript' : props.lang)

const highlightedCode = computed(() => {
  return highlighter?.codeToHtml(props.code, props.lang)
})
</script>

<template>
  <div
    v-if="highlighterInitialized"
    v-html="highlightedCode"
  />
</template>

<style>
.shiki{
  padding: 16px;
}
</style>
