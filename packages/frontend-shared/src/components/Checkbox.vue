<template>
  <div class="relative flex items-center">
    <div class="flex items-center h-5">
      <input
        :id="id"
        :value="modelValue"
        :aria-describedby="`${id}-description`"
        :name="id"
        type="checkbox"
        class="border
        rounded
        border-gray-200
        bg-white h-4 w-4
        text-indigo-500
        disabled:bg-gray-100
        checked:bg-indigo-500
        "
        :class="{
          'text-indigo-500 checked:border-indigo-300 checked:bg-indigo-600 checked:text-indigo-600': state === 'default',
          'checked:border-jade-300 checked:bg-jade-600 checked:text-jade-600': state === 'success',
          'checked:border-red-300 checked:bg-red-600 checked:text-red-600': state === 'danger'
        }"
        @update:modelValue="emit('update:modelValue', !!$event.target.value)"
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
type InputState = 'success' | 'danger' | 'default'

withDefaults(defineProps<{
  id: string
  modelValue: boolean
  state?: InputState
  label?: string
}>(), {
  state: 'default',
  label: undefined,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()
</script>
