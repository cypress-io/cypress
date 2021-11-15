<template>
  <RadioGroup
    :model-value="modelValue"
    class="flex border-1 border-gray-900 rounded-md h-24px w-64px text-md cursor-pointer"
    @update:model-value="emit('update:tab', $event)"
  >
    <RadioGroupOption
      v-slot="{ checked }"
      as="template"
      value="file-list"
      data-cy="file-list-radio-option"
    >
      <div
        class="flex flex-1 items-center justify-center outline-none"
        :class="{ 'bg-gray-900': checked }"
      >
        <i-cy-file-list
          :class="checked ? 'icon-dark-gray-200' : 'icon-dark-gray-700'"
        />
      </div>
    </RadioGroupOption>
    <RadioGroupOption
      v-slot="{ checked }"
      as="template"
      value="file-tree"
      data-cy="file-tree-radio-option"
    >
      <div
        class="flex flex-1 items-center justify-center outline-none"
        :class="{ 'bg-gray-900': checked }"
      >
        <i-cy-file-tree
          :class="checked ? 'icon-dark-gray-200' : 'icon-dark-gray-700'"
        />
      </div>
    </RadioGroupOption>
  </RadioGroup>
</template>

<script lang="ts" setup>
import { RadioGroup, RadioGroupOption } from '@headlessui/vue'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:tab', tab: string): void
}>()
</script>
