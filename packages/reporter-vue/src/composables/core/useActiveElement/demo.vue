<script setup lang="ts">
import { computed } from 'vue'
import { useActiveElement } from '.'

const activeElement = useActiveElement()
const key = computed(() => activeElement.value?.dataset?.id || 'null')
</script>

<template>
  <note
    class="mb-3"
  >
    Select the inputs below to see the changes
  </note>
  <div
    class="
    grid
    grid-cols-1
    md:grid-cols-3
    gap-2"
  >
    <input
      v-for="i in 6"
      :key="i"
      type="text"
      :data-id="i"
      class="!my-0"
      :placeholder="`${i}`"
    />
  </div>
  <div class="mt-2">
    Current Active Element:
    <span class="text-primary">{{ key }}</span>
  </div>
</template>
