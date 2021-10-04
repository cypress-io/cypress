<template>
  <div class="flex w-full gap-16px">
  <Input
    type="search"
    class="flex-grow h-full min-w-200px"
    prefix-icon-classes="icon-light-gray-50 icon-dark-gray-500"
    :prefix-icon="IconMagnifyingGlass"
    :model-value="inputValue"
    :placeholder="t('specPage.searchPlaceholder')"
    @input="onInput"
  />

  <div class="flex h-40px gap-16px min-w-127px">
    <Button
      :prefix-icon="IconAdd"
      prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
      class="min-w-127px text-size-16px focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
      @click="$emit('new-spec')"
    >
      {{ t('specPage.newSpecButton') }}
    </Button>
  </div>
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconMagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import IconAdd from '~icons/cy/add-large_x16'

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
  inputValue.value = (e as Event & { target: HTMLInputElement | null }).target?.value || ''
}
</script>
