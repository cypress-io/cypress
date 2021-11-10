<!--
  Dropzone for DIRECTORIES ONLY
-->
<template>
  <FileSelector
    v-slot="{ openDialog }"
    v-model="files"
    :accept="accept"
    allow-multiple
  >
    <Dropzone
      v-if="dropzone"
      @click="openDialog"
    >
      <slot />
    </Dropzone>
    <slot
      v-else
      v-bind="{openDialog, files}"
    />
  </FileSelector>
  <div
    data-testid="upload-name"
    class="hidden"
  />
  <button
    v-if="closeButton && !$slots.default"
    aria-label="Close"
    class="text-gray-400 hocus:text-gray-500 outline-none absolute w-32px
    h-32px right-8px top-8px flex items-center justify-center"
    @click="emit('close')"
  >
    <i-cy-delete_x12 class="icon-dark-current w-12px h-12px" />
  </button>
</template>
<script setup lang="ts">
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted, getCurrentInstance } from 'vue'

import { useI18n } from '@cy/i18n'

const { t } = useI18n()

// const component = getCurrentInstance()

const files = ref<FileList | []>([] as any)

watch(files, (newVal) => {
  if (newVal?.length) {
    handleFileSelection(newVal)
  }
})

function handleFileSelection (fileList: FileList | []) {
  const path = getFilePath(fileList)

  emit('add', path)

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

const props = withDefaults(defineProps<{
  directory?: boolean
  dropzone?: boolean
  closeButton?: boolean
  accept?: string[]
}>(), {
  closeButton: false,
  accept: () => ([]),
  dropzone: true,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', value: string): void
}>()

if (props.directory) {
  onMounted(() => {
    const current = getCurrentInstance()

    // TODO: remove this when vue3-file-selector supports setting this attribute
    const closestElement = current?.vnode.el?.nodeType === 1 ? current?.vnode.el?.nodeType : current?.vnode.el?.parentElement
    const fileRef = closestElement.querySelector('input[type=file]')

    fileRef?.setAttribute('webkitdirectory', 'webkitdirectory')
    fileRef?.setAttribute('webkitRelativePath', 'webkitRelativePath')
  })
}
</script>
