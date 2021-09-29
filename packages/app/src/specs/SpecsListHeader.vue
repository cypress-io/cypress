<template>
  <Button @click="emit('new-spec')">
    {{ t('specPage.newSpecButton') }}
  </Button>
  <Input
    type="search"
    class="min-w-200px h-full flex-grow"
    prefix-icon-classes="icon-light-gray-50 icon-dark-gray-500"
    :prefix-icon="MagnifyingGlass"
    :value="inputValue"
    :placeholder="t('specPage.searchPlaceholder')"
    @input="onInput"
  />

  <div class="h-40px flex gap-16px">
    <Button
      :prefix-icon="IconDocumentPlus"
      prefix-icon-class="text-center justify-center text-lg
      icon-light-transparent icon-dark-white"
      class="min-w-127px text-size-16px focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
      @click="$emit('new-spec')"
    >
      {{ t('specsPage.newSpecButton') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import MagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import IconDocumentPlus from '~icons/cy/document-plus_x16'

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
