<template>
  <StandardModal :clickOutside="false" v-model="modal" variant="bare">
    <template #overlay="{classes}">
      <DialogOverlay :class="classes" class="bg-gray-900 opacity-[0.97]" />
    </template>
    <template #title>
      <h2 class="inline-block font-medium text-gray-900 text-size-18px">
        {{ title }}
      </h2>
    </template>
    <!-- The presence of the description slot within StandardModal adds
additional style, classes, and padding. Make sure to render it intentionally -->

    <template #description v-if="description">{{ description }}</template>

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
import { DialogOverlay } from '@headlessui/vue'
import { ref } from 'vue'
import Button from '@cy/components/Button.vue'
import StandardModal from '@cy/components/StandardModal.vue'

const modal = ref(true)
const title = ref('')
const description = ref('')

defineProps<{
  currentGenerator: SpecGenerator | null,
}>()
</script>
