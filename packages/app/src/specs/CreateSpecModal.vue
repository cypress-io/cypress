<template>
  <StandardModal :clickOutside="false"
    :modelValue="show"
    @update:modelValue="close"
    variant="bare"
    data-testid="create-spec-modal"
    >

    <template #overlay="{classes}">
      <DialogOverlay :class="classes" class="bg-gray-900 opacity-[0.97]" data-testid="create-spec-modal-overlay"/>
    </template>
    <template #title>
      <h2 class="inline-block font-medium text-gray-900 text-size-18px" data-testid="create-generator-title">
        {{ title }}
      </h2>
    </template>
    <!-- The presence of the description slot within StandardModal adds
additional style, classes, and padding. Make sure to render it intentionally -->

    <template #description v-if="description" data-testid="create-generator-description">{{ description }}</template>

    <!-- Each generator contains the entry component which leads the
user through the flow to generate a spec. When a generator is finished, it
will emit a success or failure event -->
    <component
      v-model:title="title" 
      v-model:description="description"
      :is="currentGenerator?.entry">
    </component>
  </StandardModal>
</template>

<script lang="ts" setup>
import type { SpecGenerator } from './generators'
import { ref } from 'vue'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'

withDefaults(defineProps<{
  show?: boolean
  currentGenerator?: SpecGenerator | null,
}>(), {
  currentGenerator: null,
  show: false
})

const emits = defineEmits<{
  (event: 'close', value: boolean): void
}>()

const close = () => emits('close', false)

const title = ref('')
const description = ref('')
</script>
