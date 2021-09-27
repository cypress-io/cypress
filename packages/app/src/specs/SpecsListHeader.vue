<template>
  <Button>
  <input :value="inputValue" @input="onInput">
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core''

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const inputValue = useVModel(props, 'modelValue', emit)

const onInput = (e) => {
  inputValue.value = (<Event & { target: HTMLInputElement | null }>e).target?.value || ''
}
</script>
