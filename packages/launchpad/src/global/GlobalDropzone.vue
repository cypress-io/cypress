<template>
  <div class="relative cursor-pointer">
    <FileDropzone
      directory
      :close-button="closeButton"
      @add="$emit('addProject', $event)"
    >
      <div
        class="relative block w-full p-58px text-center border-1
    border-gray-200 border-dashed rounded-lg h-240px min-w-220px
    bg-gray-50 hocus-default"
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
    </FileDropzone>
  </div>
</template>
<script setup lang="ts">
import FileDropzone from '@cy/components/FileDropzone.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineEmits<{
  (e: 'addProject', value: string): void
}>()

withDefaults(defineProps<{
  closeButton: boolean
}>(), {
  closeButton: false,
})

</script>
