<template>
  <prism-editor
    class="font-mono leading-tight prism-editor"
    v-model="localValue"
    :readonly="readonly"
    :highlight="highlighter"
  />
</template>

<script setup lang="ts">
import prism from "prismjs"
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css" // import the styles somewhere
import "prismjs/themes/prism.css" // import syntax highlighting styles
import { useModelWrapper } from "../composables"

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

// @ts-ignore
const highlighter = (code: string) => prism.highlight(code, prism.languages.js)
const localValue = useModelWrapper(props, emit, 'modelValue')
</script>

<style>
.prism-editor__line-number {
  display: none;
}

.prism-editor textarea {
  @apply focus:ring-0 focus:outline-none;
}
</style>