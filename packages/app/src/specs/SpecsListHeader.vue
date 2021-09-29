<template>
  <Button @click="emit('new-spec')">{{ t('specPage.newSpecButton') }}</Button>
  <Input
    type="search"
    :prefix-icon="MagnifyingGlass"
    :value="inputValue"
    :placeholder="t('specPage.searchPlaceholder')" @input="onInput"/>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import MagnifyingGlass from '~icons/cy/magnifying-glass_x16'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'new-spec'): void
}>()

const inputValue = useVModel(props, 'modelValue', emit)

const onInput = (e) => {
  inputValue.value = (<Event & { target: HTMLInputElement | null }>e).target?.value || ''
}
</script>
