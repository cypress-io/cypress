<template>
  <code class="text-[14px] leading-[24px]">
    <template
      v-for="(part, index) in parts"
      :key="index"
    >
      <span
        v-if="part.highlight"
        :class="props.highlightClass"
      >
        {{ part.text }}
      </span>

      <template v-else>
        {{ part.text }}
      </template>
    </template>
  </code>
</template>

<script lang="ts" setup>
import type { FilePart } from '../../utils/stringToRegexp'

const props = defineProps<{
  parts: readonly FilePart[]
  highlightClass: string
}>()

</script>
