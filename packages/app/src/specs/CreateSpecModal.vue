<template>
  <StandardModal
    class="transition duration-200 transition-all"
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
    <div class="min-h-280px sm:min-w-640px flex flex-col">
      <component
        :is="generator.entry"
        v-if="generator"
        :key="generator.id"
        v-model:title="title"
        :code-gen-glob="props.gql.currentProject?.codeGenGlob"
        :project-config="props.gql.currentProject?.config"
        @restart="currentGeneratorId = undefined"
      />
      <div
        v-else
        class="flex-grow flex items-center self-center"
      >
        <CreateSpecCards
          :gql="props.gql"
          @select="id => currentGeneratorId = id"
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

defineEmits<{
  (eventName: 'close'): void
}>()

gql`
fragment CreateSpecModal on Query {
  ...CreateSpecCards
  currentProject {
    id
    ...ComponentGeneratorStepOne_codeGenGlob
    ...EmptyGeneratorCardStepOne
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

whenever(not(generator), () => {
  title.value = t('createSpec.newSpecModalTitle')
})
</script>
