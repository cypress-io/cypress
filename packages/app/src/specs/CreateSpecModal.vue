<template>
  <StandardModal
    :click-outside="false"
    :model-value="show"
    variant="bare"
    data-testid="create-spec-modal"
    @update:modelValue="close"
  >
    <template #overlay="{classes}">
      <DialogOverlay
        :class="classes"
        class="bg-gray-900 opacity-[0.97]"
      />
    </template>
    <template #title>
      <h2 class="inline-block font-medium text-gray-900 text-size-18px">
        {{ title }}
      </h2>
    </template>
    <!-- The presence of the description slot within StandardModal adds
additional style, classes, and padding. Make sure to render it intentionally -->

    <template
      v-if="description"
      #description
    >
      {{ description }}
    </template>

    <!-- Each generator contains the entry component which leads the
user through the flow to generate a spec. When a generator is finished, it
will emit a success or failure event -->
    <component
      v-if="currentGenerator"
      @restart="currentGenerator = null"
      :is="currentGenerator?.entry"
      v-model:title="title"
      v-model:description="description"
    />

    <CreateSpecChooser v-else>
      
    </CreateSpecChooser>
  </StandardModal>
</template>

<script lang="ts" setup>
import type { SpecGenerator } from './generators'
import { ref, watch } from 'vue'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import { useVModels, whenever, not} from '@vueuse/core'
import { generators } from './generators'
const props = defineProps<{
  show: boolean
  // currentGenerator?: SpecGenerator | null
}>()

const emits = defineEmits<{
  (event: 'close', value: boolean): void
}>()

const close = () => emits('close', false)

const currentGenerator = ref(generators[3])

watch(currentGenerator, () => {
  if (!currentGenerator.value) {
    debugger;
  }
})

const title = ref('')
const description = ref('')
</script>
