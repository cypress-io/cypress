<template>
  <div class="relative flex items-center">
    <div class="flex items-center h-5">
      <input
        :id="id"
        v-model="localValue"
        :value="id"
        :aria-describedby="`${id}-description`"
        :name="id"
        type="checkbox"
        :disabled="disabled"
        class="border
        rounded
        border-gray-200
        bg-white h-4 w-4
        text-indigo-500
        checked:bg-indigo-500
        disabled:bg-gray-100
        hover:disabled:bg-gray-100
        "
        :class="{
          'text-indigo-500 checked:border-indigo-500 checked:bg-indigo-400 checked:text-indigo-400': state === 'default',
          'checked:border-jade-300 checked:bg-jade-600 checked:text-jade-600': state === 'success',
          'checked:border-red-300 checked:bg-red-600 checked:text-red-600': state === 'danger'
        }"
      >
    </div>
    <div class="ml-2 text-[16px] leading-normal">
      <slot name="label">
        <label
          v-if="label"
          :for="id"
          class="disabled:text-gray-500 text-gray-800 font-light select-none"
        >
          {{ label }}
        </label>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useModelWrapper } from '../composables'

type InputState = 'success' | 'danger' | 'default' | 'disabled'

const props = withDefaults(defineProps<{
  id: string
  modelValue: any
  state?: InputState
  disabled?: boolean
  label?: string
}>(), {
  state: 'default',
  label: undefined,
  disabled: false,
})

const emits = defineEmits<{
  (event: 'update:modelValue'): void
}>()

const localValue = useModelWrapper(props, emits)
</script>
