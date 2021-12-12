<template>
  <code class="text-14px leading-24px"><template
    v-for="(part, index) in fileParts"
    :key="index"
  ><span
    v-if="part.highlight"
    :class="props.highlightClass"
  >{{ part.text }}</span><template
    v-else
  >{{ part.text }}</template></template></code>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  file: string
  highlightRegExp: RegExp,
  highlightClass?: string
}>(), {
  highlightClass: 'text-jade-500',
})

const fileParts = computed(() => {
  let result:RegExpExecArray | null
  let start:number = 0
  const allParts: { text:string, highlight:boolean }[] = []

  while ((result = props.highlightRegExp.exec(props.file))) {
    allParts.push({
      text: props.file.slice(start, result.index),
      highlight: false,
    })

    allParts.push({
      text: result[0],
      highlight: true,
    })

    start = result.index + result[0].length
  }

  if (start < props.file.length) {
    allParts.push({
      text: props.file.slice(start),
      highlight: false,
    })
  }

  return allParts
})

</script>
