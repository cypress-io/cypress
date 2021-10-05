<template>
  <Input
    v-model="localValue"
    type="search"
    class="min-w-200px w-80% flex-grow"
    :placeholder="t('globalPage.searchPlaceholder')"
  />
  <input
    ref="fileInputRef"
    type="file"
    class="hidden"
    webkitdirectory
    webkitRelativePath
    @change="handleFileSelection"
  >
  <Button
    :prefix-icon="IconPlus"
    aria-controls="fileupload"
    prefix-icon-class="text-center justify-center text-lg"
    class="w-20% min-w-120px text-size-16px h-full focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
    data-testid="addProjectButton"
    @click="handleButtonClick"
  >
    {{ t('globalPage.addProjectButton') }}
  </Button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { getDirectoryPath } from '../utils/getDirectoryPath'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconPlus from '~icons/mdi/plus'
import { useModelWrapper } from '@packages/frontend-shared/src/composables'
import { useI18n } from '@cy/i18n'

const fileInputRef = ref<HTMLInputElement>()
const { t } = useI18n()

const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'addProject', value: string): void
}>()

function handleButtonClick () {
  fileInputRef.value?.click()
}

function handleFileSelection (e: Event) {
  const target = e.target as HTMLInputElement
  const dirPath = getDirectoryPath(target.files)

  emits('addProject', dirPath)
}

const localValue = useModelWrapper(props, emits, 'modelValue')
</script>
