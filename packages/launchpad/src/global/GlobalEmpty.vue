<template>
  <main class="text-center">
    <h1 class="text-2rem mb-2">{{ t('globalPage.empty.title') }}</h1>
    <p class="text-lg font-light text-gray-600 mb-6">{{ t('globalPage.empty.helper') }}</p>
    <file-selector v-model="files" v-slot="{ openDialog }" allow-multiple>
      <dropzone v-slot="{ hovered }" @click="openDialog">
        <div
          class="min-w-220px relative block w-full border-2 bg-gray-50 border-gray-300 border-dashed rounded-lg p-12 text-center hover:border-gray-400 text-center"
          :class="{ 'border-blue-200': hovered }"
        >
          <IconPlaceholder
            class="mx-auto max-w-65px h-full relative justify-center w-full text-indigo-600"
          />
          <i18n-t keypath="globalPage.empty.dropText">
            <button
              class="text-indigo-600 hover:underline"
            >
            <!-- 
              This button allows keyboard users to fire a click event with the Enter or Space keys, 
              which will be handled by the dropzone's existing click handler.
             -->
            {{ t('globalPage.empty.browseManually') }}</button>
          </i18n-t>
        </div>
      </dropzone>
    </file-selector>
  </main>
</template>

<script lang="ts" setup>
import { useI18n } from "../composables"
import IconPlaceholder from 'virtual:vite-icons/icons8/circle-thin'
import { FileSelector, Dropzone } from 'vue3-file-selector'
import { ref, watch, onMounted } from 'vue'

const { t } = useI18n()
const files = ref([])
const selectProject = (file) => { console.log(file) }

watch(files, (newVal) => {
  const uploadLength = newVal.length;
  const latestUpload = newVal[uploadLength - 1]
  selectProject(latestUpload)
})

onMounted(() => {
  // force the manual upload to only allow directories
  document.querySelector('input[type=file]')?.setAttribute('webkitdirectory', 'webkitdirectory')
})


</script>
