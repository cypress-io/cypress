<template>
  <main
    ref="projectUpload"
    class="text-center"
  >
    <h1 class="mb-2 text-2rem">
      {{ t('globalPage.empty.title') }}
    </h1>
    <p class="mb-6 text-lg font-light text-body-gray">
      {{ t('globalPage.empty.helper') }}
    </p>
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
          class="relative block w-full p-12 text-center border-2 border-gray-300 border-dashed rounded-lg h-240px min-w-220px bg-gray-50 hover:border-gray-400"
          :class="{ 'border-blue-200': hovered }"
        >
          <IconPlaceholder class="relative mx-auto mb-2 w-72px h-72px text-primary" />
          <span class="font-light text-body-gray-700 text-18px">
            <i18n-t keypath="globalPage.empty.dropText">
              <button class="font-medium text-primary hover:underline">
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
    <div
      data-testid="upload-name"
      class="hidden"
    >
      {{ uploadName }}
    </div>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from '../composables'
import IconPlaceholder from 'virtual:vite-icons/icons8/circle-thin'
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted } from 'vue'

const { t } = useI18n()
const files = ref<File[]>([])
const uploadName = ref('')
const projectUpload = ref<HTMLDivElement>()

const selectProject = (file: File) => {
  uploadName.value = file.name
}

watch(files, (newVal) => {
  const uploadLength = newVal.length
  const latestUpload = newVal[uploadLength - 1]

  selectProject(latestUpload)
})

onMounted(() => {
  // TODO: remove this when vue3-file-selector supports setting this attribute
  projectUpload.value?.querySelector('input[type=file]')?.setAttribute('webkitdirectory', 'webkitdirectory')
})

</script>
