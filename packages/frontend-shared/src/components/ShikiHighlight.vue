<script lang="ts">
import { Highlighter, getHighlighter, setOnigasmWASM, setCDN } from 'shiki'
import onigasm from 'onigasm/lib/onigasm.wasm?url'

setOnigasmWASM(onigasm)
setCDN('/shiki/')

let highlighter: Highlighter

async function initHighlighter () {
  if (highlighter) {
    return
  }

  highlighter = await getHighlighter({
    themes: ['cypress'],
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
  lineNumbers?: boolean
}>(), {
  lineNumbers: false,
})

const resolvedLang = computed(() => 'js' === props.lang ? 'javascript' : 'ts' === props.lang ? 'typescript' : props.lang)

const highlightedCode = computed(() => {
  return highlighter?.codeToHtml(props.code, resolvedLang.value)
})
</script>

<template>
  <div
    v-if="highlighterInitialized"
    :class="{'line-numbers':lineNumbers}"
    v-html="highlightedCode"
  />
</template>

<style>
.shiki {
  padding: 16px;
}
.line-numbers .shiki code {
  counter-reset: step;
  counter-increment: step 0;
}

.line-numbers .shiki code .line::before {
  content: counter(step);
  counter-increment: step;
  width: 1rem;
  margin-right: 1.5rem;
  display: inline-block;
  text-align: right;
  color: rgba(115,138,148,.4)
}
</style>
