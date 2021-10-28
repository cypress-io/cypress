<template>
  <StandardModal
    :clickOutside="false"
    variant="bare"
    :title="title"
    :modelValue="show"
    @update:model-value="$emit('close')"
    data-testid="create-spec-modal"
  >
    <template #overlay="{classes}">
      <DialogOverlay
        :class="classes"
        class="bg-gray-900 opacity-[0.97]"
      />
    </template>
    <component v-if="generator"
    v-model:title="title"
    :key="generator.id"
    :is="generator.entry"></component>

    <CreateSpecCards v-else @select="currentGeneratorId = $event" :testingType="testingType"></CreateSpecCards>
  </StandardModal>
</template>

<script lang  ="ts" setup>
import type { SpecGenerator, GeneratorId } from './generators'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import StandardModalBody from '@cy/components/StandardModalBody.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import CreateSpecCardModal from './CreateSpecCardModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { generators } from './generators'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useModalStore } from '../store'
import type { Maybe, TestingTypeEnum } from '../generated/graphql'

const props = defineProps<{
  initialGenerator?: GeneratorId,
  show: boolean,
  testingType: TestingTypeEnum
}>()

// const modalStore = useModalStore()
const currentGeneratorId: Ref<GeneratorId | undefined> = ref(props.initialGenerator)

const title = ref('')

const generator = computed(() => {
  if (currentGeneratorId.value) return generators[currentGeneratorId.value]
  return null
})
</script>
