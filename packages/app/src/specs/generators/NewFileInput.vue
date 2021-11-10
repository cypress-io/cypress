<template>
  <div class="p-24px">
    <div class="inline-flex items-center w-full rounded border-1 hocus-default focus-within-default h-40px truncate">
      <div
        class="inline-flex items-center h-full text-gray-700 transition duration-150 rounded-l outline-none group bg-gray-50 border-r-gray-100 border-r-1 px-12px"
      >
        <span class="children:inline">
          <i-cy-folder-outline_x24 class="icon-light-200 icon-dark-500 min-w-16px min-h-16px max-h-16px max-w-16px" />
          {{ directory }}
        </span>
      </div>
      <div class="inline-flex items-center flex-grow min-w-min group">
        <FileMatchInput
          v-model="localInput"
          class="ml-12px"
          aria-label="file-name-input"
          placeholder="CheckoutPage.cy.js"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import FileMatchInput from '../../components/FileMatchInput.vue'
import { useVModels } from '@vueuse/core'

const props = withDefaults(defineProps<{
  modelValue: string
  directory?: string
}>(), {
  directory: 'cypress/e2e',
})

const emits = defineEmits<{
  (eventName: 'update:modelValue', value: string): void
}>()

const { modelValue: localInput } = useVModels(props, emits)

</script>
