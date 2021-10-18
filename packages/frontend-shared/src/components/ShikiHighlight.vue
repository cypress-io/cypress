<script lang="ts">
import { Highlighter, getHighlighter, setOnigasmWASM, setCDN } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'

setOnigasmWASM(onigasm)
setCDN('/shiki/')

let highlighter: Highlighter

export async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    themes: ['cypress.theme'],
    langs: ['typescript', 'javascript', 'css', 'json', 'yaml'],
  })
}
</script>

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'

const highlighterInitialized = ref(false)

onBeforeMount(async () => {
  await initHighlighter()
  highlighterInitialized.value = true
})

const props = withDefaults(defineProps<{
  code: string;
  lang: 'javascript' | 'typescript' | 'json' | 'js' | 'ts' | 'yaml';
  lineNumbers?: boolean,
  inline?: boolean
}>(), {
  lineNumbers: false,
  inline: false,
})

const resolvedLang = computed(() => 'js' === props.lang ? 'javascript' : 'ts' === props.lang ? 'typescript' : props.lang)

const highlightedCode = computed(() => {
  return highlighter?.codeToHtml(props.code, resolvedLang.value)
})
</script>

<template>
  <div
    v-if="highlighterInitialized"
    :class="{'line-numbers':lineNumbers, inline }"
    v-html="highlightedCode"
  />
  <pre
    v-else
    class="shiki"
    :class="{'line-numbers':lineNumbers, inline }"
  >{{ code }}</pre>
</template>

<style lang="scss">
.shiki {
  @apply bg-transparent p-4
}

.inline .shiki {
  @apply py-1 px-2 bg-gray-50 text-gray-500 overflow-x-auto inline-block
}

.line-numbers .shiki{
  @apply p-0
}

.line-numbers .shiki code {
  counter-reset: step;
  counter-increment: step 0;
}

.line-numbers .shiki code .line::before {
  content: counter(step);
  counter-increment: step;
  @apply bg-gray-50 text-gray-500 w-10 inline-block text-right px-2 mr-4
}

.line-numbers .shiki code .line:first-child::before{
  @apply pt-4
}

.line-numbers .shiki code .line:last-child::before{
  @apply pb-4
}
</style>
