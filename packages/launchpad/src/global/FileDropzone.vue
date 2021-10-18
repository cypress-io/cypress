<template>
  <div ref="projectUpload">
    <FileSelector
      v-slot="{ openDialog }"
      v-model="files"
      allow-multiple
    >
      <Dropzone
        v-slot="{ hovered }"
        @click="openDialog"
      >
        <div
          class="relative block w-full p-58px text-center border-1 border-gray-200 border-dashed rounded-lg h-240px min-w-220px bg-gray-50 hover:border-gray-400"
          :class="{ 'border-blue-200': hovered }"
        >
          <i-cy-drag-project_x80
            class="mx-auto -mb-4px w-80px h-80px icon-dark-indigo-500 icon-light-indigo-200"
          />
          <span class="font-light text-body-gray-700 text-18px">
            <i18n-t keypath="globalPage.empty.dropText">
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
  </div>
  <div
    data-testid="upload-name"
    class="hidden"
  >
    {{ uploadName }}
  </div>
</template>
<script setup lang="ts">
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted } from 'vue'

import { useI18n } from '@cy/i18n'

const { t } = useI18n()
const projectUpload = ref<HTMLDivElement>()
const files = ref<FileList>([] as any)

watch(files, (newVal) => {
  if (newVal.length) {
    handleFileSelection(newVal)
  }
})

function handleFileSelection (files: FileList) {
  const path = getFilePath(files)

  emit('addProject', path)
}

type WebkitFile = File & { path: string }
function getFilePath (files: FileList | null) {
  if (files) {
    const file = files[0] as WebkitFile
    const path = file?.path ?? ''

    return path
  }

  return ''
}

const emit = defineEmits<{
    (e: 'addProject', value: string): void
}>()

const uploadName = ref('')

onMounted(() => {
  // TODO: remove this when vue3-file-selector supports setting this attribute
  const fileRef = projectUpload.value?.querySelector('input[type=file]')

  fileRef?.setAttribute('webkitdirectory', 'webkitdirectory')
  fileRef?.setAttribute('webkitRelativePath', 'webkitRelativePath')
})
</script>
