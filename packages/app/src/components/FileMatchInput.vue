<template>
  <input
    v-model="localModelValue"
    class="grow p-0 text-gray-700 placeholder-gray-400 border-transparent outline-none placeholder-shown:overflow-ellipsis placeholder-shown:truncate hocus:border-transparent mr-[8px]"
    type="search"
    autocomplete="off"
  >
</template>

<script lang="ts" setup>
import { useVModels } from '@vueuse/core'

const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const { modelValue: localModelValue } = useVModels(props, emits)
</script>

<style scoped>
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration { display: none !important; }

</style>
