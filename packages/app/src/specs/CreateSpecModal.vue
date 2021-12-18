<template>
  <StandardModal
    class="transition transition-all duration-200"
    :click-outside="false"
    variant="bare"
    :title="title"
    :model-value="show"
    data-testid="create-spec-modal"
    @update:model-value="close"
  >
    <template #overlay="{classes}">
      <DialogOverlay
        :class="classes"
        class="bg-gray-900 opacity-[0.97]"
      />
    </template>
    <div class="flex flex-col min-h-280px sm:min-w-640px">
      <component
        :is="generator.entry"
        v-if="generator"
        :key="generator.id"
        v-model:title="title"
        :code-gen-glob="codeGenGlob"
        @restart="currentGeneratorId = undefined"
        @close="close"
      />
      <div
        v-else
        class="flex-grow flex items-center self-center"
      >
        <CreateSpecCards
          :gql="props.gql"
          @select="currentGeneratorId = $event"
        />
      </div>
    </div>
  </StandardModal>
</template>

<script lang  ="ts" setup>
import { generators, GeneratorId } from './generators'
import { DialogOverlay } from '@headlessui/vue'
import StandardModal from '@cy/components/StandardModal.vue'
import CreateSpecCards from './CreateSpecCards.vue'
import { ref, computed, Ref } from 'vue'
import type { CreateSpecModalFragment } from '../generated/graphql'
import { gql } from '@urql/vue'
import { not, whenever } from '@vueuse/core'
import { useI18n } from '@cy/i18n'

const props = defineProps<{
  initialGenerator?: GeneratorId,
  show: boolean,
  gql: CreateSpecModalFragment
}>()

const emits = defineEmits<{
  (eventName: 'close'): void
}>()

gql`
fragment CreateSpecModal on Query {
  ...CreateSpecCards
  currentProject {
    id
    ...ComponentGeneratorStepOne_codeGenGlob
    ...StoryGeneratorStepOne_codeGenGlob
  }
}
`

const currentGeneratorId: Ref<GeneratorId | undefined> = ref(props.initialGenerator)

const { t } = useI18n()
const title = ref(t('createSpec.newSpecModalTitle'))

const generator = computed(() => {
  if (currentGeneratorId.value) return generators[currentGeneratorId.value]

  return null
})

const codeGenGlob = computed(() => {
  if (!generator.value) {
    return null
  }

  return props.gql.currentProject?.codeGenGlobs[generator.value.id]
})

whenever(not(generator), () => {
  title.value = t('createSpec.newSpecModalTitle')
})

function close () {
  currentGeneratorId.value = undefined
  emits('close')
}
</script>
