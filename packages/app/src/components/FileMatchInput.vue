<template>  
  <input
  v-model="modelValue"
  class="flex-grow p-0 text-gray-700 placeholder-gray-400 border-transparent outline-none hocus:border-transparent"
  type="search">
</template>

<script lang="ts" setup>
import { useVModels } from '@vueuse/core'

const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const { modelValue } = useVModels(props, emits)
</script>