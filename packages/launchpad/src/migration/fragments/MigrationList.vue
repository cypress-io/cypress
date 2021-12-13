<template>
  <ul class="list-disc pl-24px text-jade-400">
    <li
      v-for="slot in slotNames"
      :key="slot"
      class="mb-4px"
    >
      <span class="text-gray-600">
        <slot :name="slot" />
      </span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { useSlots } from 'vue'

const slots = useSlots()
const slotNames:string[] = []
let i = 0

while (slots[`line-${++i}`]) {
  slotNames.push(`line-${i}`)
}
</script>
