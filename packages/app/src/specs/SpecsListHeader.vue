<template>
<<<<<<< HEAD
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
        data-testid="new-spec-button"
        :prefix-icon="IconAdd"
        prefix-icon-class="justify-center text-lg text-center icon-light-transparent icon-dark-white"
        class="min-w-127px text-size-16px focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
        @click="$emit('new-spec')"
      >
        {{ t('specPage.newSpecButton') }}
      </Button>
    </div>
=======
<div class="h-40px flex gap-16px">
  <Input
    type="search"
    class="min-w-200px h-full flex-grow"
    :placeholder="t('specsPage.searchPlaceholder')"
    v-model="localValue"
    prefixIconClasses="icon-light-gray-50 icon-dark-gray-500"
  />
  <Button
    @click="$emit('new-spec')"
    :prefixIcon="IconDocumentPlus"
  prefixIconClass="text-center justify-center text-lg
  icon-light-transparent icon-dark-white"
    class="min-w-127px text-size-16px focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
  >{{ t('specsPage.newSpecButton') }}</Button>
>>>>>>> 0332774429 (wip)
  </div>
</template>

<script lang="ts" setup>
<<<<<<< HEAD
import { useVModel } from '@vueuse/core'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconMagnifyingGlass from '~icons/cy/magnifying-glass_x16'
import IconAdd from '~icons/cy/add-large_x16'
=======
import Button from '../components/button/Button.vue'
import Input from '../components/input/Input.vue'
import IconDocumentPlus from '~icons/cy/document-plus_x16'
import { useI18n, useModelWrapper } from '../composables'
>>>>>>> 0332774429 (wip)

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

<<<<<<< HEAD
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'new-spec'): void
}>()

const inputValue = useVModel(props, 'modelValue', emit)
=======
const emits = defineEmits(['update:modelValue', 'new-spec'])
>>>>>>> 0332774429 (wip)

const onInput = (e) => {
  inputValue.value = (e as Event & { target: HTMLInputElement | null }).target?.value || ''
}
</script>
