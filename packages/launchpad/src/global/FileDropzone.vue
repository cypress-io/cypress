<template>
  <div
    ref="projectUpload"
    class="cursor-pointer relative"
  >
    <FileSelector
      v-model="files"
      allow-multiple
    >
      <Dropzone @click="handleOpenDialog">
        <div
          class="border-dashed bg-gray-50 border border-gray-200 rounded-[4px] h-[240px]
        text-center w-full min-w-[220px] p-[58px] relative
        block hocus-default"
          data-cy="dropzone"
        >
          <i-cy-drag-project_x80
            class="mx-auto h-[80px] mb-[-4px] w-[80px] icon-dark-indigo-500 icon-light-indigo-200"
          />
          <span class="font-light text-body-gray-700 text-[18px]">
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
      class="flex outline-none h-[32px] top-[8px] right-[8px]
    text-gray-400 w-[32px] absolute items-center justify-center hocus:text-gray-500"
      @click="emit('close')"
    >
      <i-cy-delete_x12 class="h-[12px] w-[12px] icon-dark-current" />
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

function handleOpenDialog () {
  // Set the path to null, so we can use the electron folder select on the server side
  emit('addProject', null)
}

const emit = defineEmits<{
  (e: 'addProject', value: string | null): void
  (e: 'close'): void
}>()

withDefaults(defineProps<{
  closeButton?: boolean
}>(), {
  closeButton: false,
})

onMounted(() => {
  // vue3-file-selector does not support setting these attributes through props,
  // so we add them directly after mounting.
  const fileRef = projectUpload.value?.querySelector('input[type=file]')

  fileRef?.setAttribute('webkitdirectory', 'webkitdirectory')
  fileRef?.setAttribute('webkitRelativePath', 'webkitRelativePath')
})
</script>
