<template>
  <div
    ref="projectUpload"
    class="relative cursor-pointer"
  >
    <FileSelector
      v-slot="{ openDialog }"
      v-model="files"
      allow-multiple
    >
      <Dropzone @click="openDialog">
        <div
          class="relative block w-full p-58px text-center border-1
        border-gray-200 border-dashed rounded-lg h-240px min-w-220px
        bg-gray-50 hocus-default"
          data-cy="dropzone"
        >
          <i-cy-drag-project_x80
            class="mx-auto -mb-4px w-80px h-80px icon-dark-indigo-500 icon-light-indigo-200"
          />
          <span class="font-light text-body-gray-700 text-18px">
            <i18n-t
              scope="global"
              keypath="globalPage.empty.dropText"
            >
              <button class="font-medium text-indigo-500 hocus-link-default">
                <!--
              This button allows keyboard users to fire a click event with the Enter or Space keys,
              which will be handled by the dropzone's existing click handler.
                -->
                {{ t('globalPage.empty.browseManually') }}
              </button>
            </i18n-t>
          </span>
        </div>
      </Dropzone>
    </FileSelector>
    <button
      v-if="closeButton"
      aria-label="Close"
      class="text-gray-400 hocus:text-gray-500 outline-none absolute w-32px
    h-32px right-8px top-8px flex items-center justify-center"
      @click="emit('close')"
    >
      <i-cy-delete_x12 class="icon-dark-current w-12px h-12px" />
    </button>
  </div>
</template>
<script setup lang="ts">
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted } from 'vue'

import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const projectUpload = ref<HTMLDivElement>()
const files = ref<FileList | []>([] as any)

watch(files, (newVal) => {
  if (newVal?.length) {
    handleFileSelection(newVal)
  }
})

function handleFileSelection (fileList: FileList | []) {
  const path = getFilePath(fileList)

  emit('addProject', path)

  // reset file list between uploads, if we don't do this, a user
  // accidentally re-uploading a project blocks upload attempts
  files.value = []
}

type WebkitFile = File & { path: string }
function getFilePath (files: FileList | null | []) {
  if (files) {
    const file = files[0] as WebkitFile
    const path = file?.path ?? ''

    return path
  }

  return ''
}

const emit = defineEmits<{
  (e: 'addProject', value: string): void
  (e: 'close'): void
}>()

withDefaults(defineProps<{
  closeButton: boolean
}>(), {
  closeButton: false,
})

onMounted(() => {
  // TODO: remove this when vue3-file-selector supports setting this attribute
  const fileRef = projectUpload.value?.querySelector('input[type=file]')

  fileRef?.setAttribute('webkitdirectory', 'webkitdirectory')
  fileRef?.setAttribute('webkitRelativePath', 'webkitRelativePath')
})
</script>
