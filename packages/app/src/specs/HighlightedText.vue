<template>
  <span>
    <span
      v-for="({char, highlighted}, idx) in characters"
      :key="idx"
      :class="{'px-[4px]': char === '/'}"
    >
      <span
        v-if="highlighted"
        :class="highlightClasses"
      >{{ char }}</span>
      <template v-else>
        {{ char }}
      </template>

    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{text: string, indexes: number[], highlightClasses?: string}>(),
  { text: '', indexes: () => [], highlightClasses: 'text-white' },
)

const characters = computed(() => {
  const chars = props.text.split('').map((char) => ({ char, highlighted: false }))

  props.indexes.forEach((idx) => chars[idx].highlighted = true)

  return chars
})
</script>
