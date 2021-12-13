<template>
  <div
    class="border rounded bg-light-50 border-gray-100 mb-4 w-full block
  overflow-hidden hocus-default"
  >
    <ListRowHeader
      :class="{
        'border-b border-b-gray-100 rounded-b-none': open,
        'bg-gray-50': !open
      }"
      class="cursor-pointer"
      :description="description"
      @click="emit('toggle')"
    >
      <template #icon>
        <i-cy-status-pass-duotone_x24
          v-if="checked"
          class="h-24px w-24px"
        />
        <div
          v-else
          class="rounded-full bg-gray-100 h-24px text-center w-24px"
        >
          {{ step }}
        </div>
      </template>
      <template #header>
        <span
          class="font-semibold inline-block align-top"
          :class="open ? 'text-indigo-600': 'text-gray-600'"
        >
          {{ title }}
        </span>
      </template>
      <template #right>
        <i-cy-chevron-down
          :class="{ 'rotate-180': open }"
          class="max-w-16px transform icon-dark-gray-400"
        />
      </template>
    </ListRowHeader>
    <div
      v-if="open"
      class="border-b border-b-gray-100 p-24px"
    >
      <slot />
    </div>
    <div
      v-if="open"
      class="p-24px"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'
import ListRowHeader from '@cy/components/ListRowHeader.vue'

withDefaults(defineProps<{
  open?: boolean,
  checked?: boolean,
  step: number,
  title: string,
  description: string,
}>(), {
  open: false,
  checked: false,
})

const slots = useSlots()
const slotNames:string[] = []
let i = 0

while (slots[`step-${++i}`]) {
  slotNames.push(`step-${i}`)
}

const emit = defineEmits(['toggle'])
</script>
