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
    webkit-relative-path
    @change="handleFileSelection"
  >
  <Button
    :prefix-icon="IconPlus"
    aria-controls="fileupload"
    prefix-icon-class="text-center justify-center text-lg"
    class="w-20% min-w-120px text-size-16px h-full focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
    @click="handleButtonClick"
  >
    {{ t('globalPage.newProjectButton') }}
  </Button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import IconPlus from '~icons/mdi/plus'
import { useAddProject, useModelWrapper } from '@packages/frontend-shared/src/composables'
import { useI18n } from '@cy/i18n'

const fileInputRef = ref<HTMLInputElement>()
const { t } = useI18n()
const { addProject } = useAddProject()

const props = defineProps<{
  modelValue: string
}>()

function handleButtonClick () {
  fileInputRef.value.click()
}

function handleFileSelection (e: Event) {
  const target = e.target as HTMLInputElement
  const dirPath = getDirectoryPath(target.files)

  addProject(dirPath)
}

function getDirectoryPath (files: FileList) {
  const path = files[0].path

  return path.substring(0, path.lastIndexOf('/'))
}

const emits = defineEmits(['update:modelValue'])

const localValue = useModelWrapper(props, emits, 'modelValue')
</script>
