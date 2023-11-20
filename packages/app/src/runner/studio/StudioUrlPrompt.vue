<template>
  <div
    cy-data="studio-url-prompt"
    class="border rounded-md flex flex-col h-fit bg-gray-1000 border-gray-200 w-fit py-4 px-3 top-16 left-16 text-gray-200 z-51 studio-url-container absolute"
  >
    <div class="text-center">
      <span>{{ t('runner.studio.enterValidUrl') }}</span>
    </div>

    <form @submit.prevent="emit('submit')">
      <div class="flex mt-4 mb-1 justify-between">
        <button
          class="rounded bg-gray-800 mx-1 text-white py-1 px-3"
          type="button"
          @click="emit('cancel')"
        >
          {{ t('runner.studio.actionCancel') }}
        </button>
        <button
          class="rounded bg-gray-800 mx-1 text-white py-1 px-3 disabled:opacity-50 disabled:pointer-events-none"
          :disabled="!urlInProgress"
          type="submit"
        >
          {{ t('runner.studio.continue') }} ➜
        </button>
      </div>
    </form>
  </div>
  <div
    cy-data="studio-url-overlay"
    class="bg-black h-full w-full opacity-[.35] top-0 right-0 bottom-0 left-0 z-50 fixed"
  />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  autUrlInputRef?: HTMLInputElement
  urlInProgress: string
}>()

const emit = defineEmits<{
  (event: 'submit'): void
  (event: 'cancel'): void
}>()

onMounted(() => {
  if (props.autUrlInputRef) {
    props.autUrlInputRef.focus()
  }
})

</script>

<style lang="scss" scoped>
  .studio-url-container {
    &::before {
      content: " ";
      position: absolute;
      bottom: 100%;
      left: 50%;
      margin-left: -10px;
      border-width: 10px;
      border-style: solid;
      border-color: transparent transparent rgba(0, 0, 0, 0.15) transparent;
    }

    &::after {
      content: " ";
      position: absolute;
      bottom: 100%;
      left: 50%;
      margin-left: -9px;
      border-width: 9px;
      border-style: solid;
      border-color: transparent transparent #1B1E2E transparent;
    }
  }
</style>
