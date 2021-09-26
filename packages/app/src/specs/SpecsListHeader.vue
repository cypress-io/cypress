<template>
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
  </div>
</template>

<script lang="ts" setup>
import Button from '../components/button/Button.vue'
import Input from '../components/input/Input.vue'
import IconDocumentPlus from '~icons/cy/document-plus_x16'
import { useI18n, useModelWrapper } from '../composables'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits(['update:modelValue', 'new-spec'])

const localValue = useModelWrapper(props, emits, 'modelValue')
</script>
