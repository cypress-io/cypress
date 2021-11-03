<template>
  <StandardModal
    :click-outside="false"
    variant="bare"
    :title="title"
    :model-value="show"
    data-testid="create-spec-modal"
    @update:model-value="$emit('close')"
  >
    <template #overlay="{classes}">
      <DialogOverlay
        :class="classes"
        class="bg-gray-900 opacity-[0.97]"
      />
    </template>
    <component
      :is="generator.entry"
      v-if="generator"
      :key="generator.id"
      v-model:title="title"
    />

    <CreateSpecCards
      v-else
      :gql="props.gql"
      @select="currentGeneratorId = $event"
    />
  </StandardModal>
</template>

<script lang  ="ts" setup>
import { generators, SpecGenerator, GeneratorId } from './generators'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import StandardModalBody from '@cy/components/StandardModalBody.vue'
import StandardModalFooter from '@cy/components/StandardModalFooter.vue'
import CreateSpecCardModal from './CreateSpecCardModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { ref, computed, Ref } from 'vue'
import { useModalStore } from '../store'
import type { CreateSpecModalFragment } from '../generated/graphql'
import { gql } from '@urql/vue'

const props = defineProps<{
  initialGenerator?: GeneratorId,
  show: boolean,
  gql: CreateSpecModalFragment
}>()

defineEmits<{
  (eventName: 'close'): void
}>()

gql`
fragment CreateSpecModal on App {
  ...CreateSpecCards
}
`

const currentGeneratorId: Ref<GeneratorId | undefined> = ref(props.initialGenerator)

const title = ref('')

const generator = computed(() => {
  if (currentGeneratorId.value) return generators[currentGeneratorId.value]

  return null
})

</script>
