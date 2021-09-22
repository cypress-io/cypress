<template>
  <main class="text-center" ref="projectUpload">
    <h1 class="text-2rem mb-2">{{ t('globalPage.empty.title') }}</h1>
    <p class="text-lg font-light text-gray-600 mb-6">{{ t('globalPage.empty.helper') }}</p>
    <FileSelector v-model="files" v-slot="{ openDialog }" allow-multiple>
      <Dropzone v-slot="{ hovered }" @click="openDialog">
        <div
          class="min-w-220px relative block w-full border-2 bg-gray-50 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400"
          :class="{ 'border-blue-200': hovered }"
        >
          <IconPlaceholder
            class="mx-auto max-w-65px h-full reålative justify-center w-full text-primary"
          />
          <i18n-t keypath="globalPage.empty.dropText">
            <button class="text-primary hover:underline">
              <!-- 
              This button allows keyboard users to fire a click event with the Enter or Space keys, 
              which will be handled by the dropzone's existing click handler.
              -->
              {{ t('globalPage.empty.browseManually') }}
            </button>
          </i18n-t>
        </div>
      </Dropzone>
    </FileSelector>
    <div data-testid="upload-name" class="hidden">{{ uploadName }}</div>
    <div>
      <div class="text-primary">primary</div>
      <div class="text-secondary">secondary</div>
      <div class="text-warning-light">warning-light</div>
      <div class="text-warning">warning</div>
      <div class="text-success">success</div>
      <div class="text-error">error</div>
      <div class="text-confirm">confirm</div>
      <div class="body-text">confirm</div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from "../composables"
import IconPlaceholder from 'virtual:vite-icons/icons8/circle-thin'
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted } from 'vue'

const { t } = useI18n()
const files = ref<File[]>([])
const uploadName = ref('')
const projectUpload = ref<HTMLDivElement>()

const selectProject = (file: File) => { uploadName.value = file.name }

watch(files, (newVal) => {
  const uploadLength = newVal.length;
  const latestUpload = newVal[uploadLength - 1]
  selectProject(latestUpload)
})

onMounted(() => {
  // TODO: remove this when vue3-file-selector supports setting this attribute
  projectUpload.value?.querySelector('input[type=file]')?.setAttribute('webkitdirectory', 'webkitdirectory')
})


</script>
