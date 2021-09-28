<template>
  <Input
    v-model="localValue"
    type="search"
    class="min-w-200px w-80% flex-grow"
    :placeholder="t('globalPage.searchPlaceholder')"
  />
  <Button
    :prefix-icon="IconPlus"
    prefix-icon-class="text-center justify-center text-lg"
    class="w-20% min-w-120px text-size-16px h-full focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
    @click="$emit('new-project')"
  >
    {{ t('globalPage.newProjectButton') }}
  </Button>
</template>

<script lang="ts" setup>
import Button from '../components/button/Button.vue'
import Input from '../components/input/Input.vue'
import IconPlus from 'virtual:vite-icons/mdi/plus'
import { useI18n, useModelWrapper } from '../composables'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits(['update:modelValue', 'new-project'])

const localValue = useModelWrapper(props, emits, 'modelValue')
</script>
